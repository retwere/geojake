import * as g from "./geometry";
import * as h from "./geohash";

describe("bitsToHash", () => {
  it("converts an array of bits to a geohash string", () => {
    expect(
      h.bitsToHash(
        // prettier-ignore
        [
          1, 1, 0, 0, 0,
          0, 0, 0, 0, 0,
          0, 0, 0, 0, 1,
          1, 0, 0, 1, 1,
          0, 1, 1, 0, 1,
          1, 0, 1, 0, 0,
        ]
      )
    ).toBe("s01men");
  });

  it("throws an Error if the length of the bitstring does not divide 5", () => {
    expect(() => {
      h.bitsToHash([0, 1, 1, 1, 0, 0, 0, 0]);
    }).toThrow(h.GeohashError);
  });
});

describe("hashToBits", () => {
  it("converts a geohash string to an array of bits", () => {
    expect(h.hashToBits("s01men")).toStrictEqual(
      // prettier-ignore
      [
        1, 1, 0, 0, 0,
        0, 0, 0, 0, 0,
        0, 0, 0, 0, 1,
        1, 0, 0, 1, 1,
        0, 1, 1, 0, 1,
        1, 0, 1, 0, 0,
      ]
    );
  });

  it("throws an Error if the string contains an invalid hash character", () => {
    // 'a' is an invalid char
    expect(() => {
      h.hashToBits("bca");
    }).toThrow(h.GeohashError);
  });
});

describe("GeohashNode", () => {
  describe("isLeaf", () => {
    it("determines whether a node is a leaf", () => {
      const root = new h.GeohashNode();
      const child = root.makeChild(0);
      expect(root.isLeaf()).toBe(false);
      expect(child.isLeaf()).toBe(true);
    });
  });

  describe("isRoot", () => {
    it("determines whether a node is the root", () => {
      const root = new h.GeohashNode();
      const child = root.makeChild(0);
      expect(root.isRoot()).toBe(true);
      expect(child.isRoot()).toBe(false);
    });
  });

  describe("subHashBox", () => {
    describe("when evenBit is true", () => {
      it("splits the node's box in half by longitude", () => {
        const node = new h.GeohashNode(new g.Box([0, 0, 10, 50]), true);
        expect(node.subHashBox(0)).toStrictEqual(new g.Box([0, 0, 10, 25]));
        expect(node.subHashBox(1)).toStrictEqual(new g.Box([0, 25, 10, 50]));
      });
    });

    describe("when evenBit is false", () => {
      it("splits the node's box in half by latitude", () => {
        const node = new h.GeohashNode(new g.Box([0, 0, 10, 50]), false);
        expect(node.subHashBox(0)).toStrictEqual(new g.Box([0, 0, 5, 50]));
        expect(node.subHashBox(1)).toStrictEqual(new g.Box([5, 0, 10, 50]));
      });
    });
  });

  describe("makeChild", () => {
    describe("creates a new child of the node.", () => {
      const parent0 = new h.GeohashNode(new g.Box([0, 0, 10, 50]), false);
      const child0 = parent0.makeChild(0);

      const parent1 = new h.GeohashNode(new g.Box([0, 0, 10, 50]), true);
      const child1 = parent1.makeChild(1);

      it("has the appropriate subHashBox", () => {
        expect(child0.box).toStrictEqual(new g.Box([0, 0, 5, 50]));
        expect(child1.box).toStrictEqual(new g.Box([0, 25, 10, 50]));
      });

      it("is placed in the correct position in the parent", () => {
        expect(parent0.child[0]).toBe(child0);
        expect(parent0.child[1]).toBeNull();
        expect(parent1.child[0]).toBeNull();
        expect(parent1.child[1]).toBe(child1);
      });

      it("has the parent node as its parent", () => {
        expect(child0.parent).toBe(parent0);
        expect(child1.parent).toBe(parent1);
      });

      it("has the opposite evenBit from its parent", () => {
        expect(child0.evenBit).toBe(!parent0.evenBit);
        expect(child1.evenBit).toBe(!parent1.evenBit);
      });
    });

    describe("may be called multiple times", () => {
      const parent = new h.GeohashNode(new g.Box([0, 0, 10, 50]), true);

      it("can create up to two distinct children", () => {
        const child0 = parent.makeChild(0);
        const child1 = parent.makeChild(1);
        expect(parent.child[0]).toBe(child0);
        expect(parent.child[1]).toBe(child1);
      });

      it("does not replace existing children", () => {
        const child0_first = parent.makeChild(0);
        const child0_second = parent.makeChild(0);
        expect(child0_first).toBe(child0_second);
      });
    });
  });

  describe("fromBits", () => {
    it("constructs a geohash tree that represents the bit sequence", () => {
      const root = new h.GeohashNode();
      const depth0 = root.fromBits([0, 0, 1, 1, 0]);
      // 0th bit is 0
      expect(depth0.child[0]).not.toBeNull();
      expect(depth0.child[1]).toBeNull();
      const depth1 = <h.GeohashNode>depth0.child[0];
      // 1st bit is 0
      expect(depth1.child[0]).not.toBeNull();
      expect(depth1.child[1]).toBeNull();
      const depth2 = <h.GeohashNode>depth1.child[0];
      // 2nd bit is 1
      expect(depth2.child[0]).toBeNull();
      expect(depth2.child[1]).not.toBeNull();
      const depth3 = <h.GeohashNode>depth2.child[1];
      // 3rd bit is 1
      expect(depth3.child[0]).toBeNull();
      expect(depth3.child[1]).not.toBeNull();
      const depth4 = <h.GeohashNode>depth3.child[1];
      // 4th bit is 0
      expect(depth4.child[0]).not.toBeNull();
      expect(depth4.child[1]).toBeNull();
      const depth5 = <h.GeohashNode>depth4.child[0];
      // last node should be a leaf
      expect(depth5.isLeaf()).toBe(true);
    });

    it("can be called multiple times to create a branching tree", () => {
      // Construct a tree that looks like this:
      //                root
      //               /
      //             0
      //           /
      //         0
      //       /   \
      //      0     1
      //       \   /
      //        1 0
      const root = new h.GeohashNode()
        .fromBits([0, 0, 0, 1])
        .fromBits([0, 0, 1, 0]);
      // 0
      expect(root.child[0]).not.toBeNull();
      expect(root.child[1]).toBeNull();
      const child0 = <h.GeohashNode>root.child[0];
      // 00
      expect(child0.child[0]).not.toBeNull();
      expect(child0.child[1]).toBeNull();
      const child00 = <h.GeohashNode>child0.child[0];
      // 000
      expect(child00.child[0]).not.toBeNull();
      const child000 = <h.GeohashNode>child00.child[0];
      // 001
      expect(child00.child[1]).not.toBeNull();
      const child001 = <h.GeohashNode>child00.child[1];
      // 0001
      expect(child000.child[0]).toBeNull();
      expect(child000.child[1]).not.toBeNull();
      const child0001 = <h.GeohashNode>child000.child[1];
      expect(child0001.isLeaf()).toBe(true);
      // 0010
      expect(child001.child[0]).not.toBeNull();
      expect(child001.child[1]).toBeNull();
      const child0010 = <h.GeohashNode>child001.child[0];
      expect(child0010.isLeaf()).toBe(true);
    });

    it("returns the same node that was passed in", () => {
      const root = new h.GeohashNode();
      const result = root.fromBits([0, 0, 1, 1, 0]);
      expect(result).toBe(root);
    });
  });

  describe("fromHash", () => {
    it("constructs a geohash tree that represents the geohash string", () => {
      const root = new h.GeohashNode();
      const depth0 = root.fromHash("6"); // 00110
      // 0th bit is 0
      expect(depth0.child[0]).not.toBeNull();
      expect(depth0.child[1]).toBeNull();
      const depth1 = <h.GeohashNode>depth0.child[0];
      // 1st bit is 0
      expect(depth1.child[0]).not.toBeNull();
      expect(depth1.child[1]).toBeNull();
      const depth2 = <h.GeohashNode>depth1.child[0];
      // 2nd bit is 1
      expect(depth2.child[0]).toBeNull();
      expect(depth2.child[1]).not.toBeNull();
      const depth3 = <h.GeohashNode>depth2.child[1];
      // 3rd bit is 1
      expect(depth3.child[0]).toBeNull();
      expect(depth3.child[1]).not.toBeNull();
      const depth4 = <h.GeohashNode>depth3.child[1];
      // 4th bit is 0
      expect(depth4.child[0]).not.toBeNull();
      expect(depth4.child[1]).toBeNull();
      const depth5 = <h.GeohashNode>depth4.child[0];
      // last node should be a leaf
      expect(depth5.isLeaf()).toBe(true);
    });

    it("can be called multiple times to create a branching tree", () => {
      // Construct a tree that looks like this:
      //                 root
      //                /
      //              0
      //            /
      //          0
      //       /     \
      //      0       1
      //       \     /
      //        1   0
      //       / \   \
      //      0   1   1
      const root = new h.GeohashNode()
        .fromHash("2") // 00010
        .fromHash("3") // 00011
        .fromHash("5"); //00101
      // 0
      expect(root.child[0]).not.toBeNull();
      expect(root.child[1]).toBeNull();
      const child0 = <h.GeohashNode>root.child[0];
      // 00
      expect(child0.child[0]).not.toBeNull();
      expect(child0.child[1]).toBeNull();
      const child00 = <h.GeohashNode>child0.child[0];
      // 000
      expect(child00.child[0]).not.toBeNull();
      const child000 = <h.GeohashNode>child00.child[0];
      // 001
      expect(child00.child[1]).not.toBeNull();
      const child001 = <h.GeohashNode>child00.child[1];
      // 0001
      expect(child000.child[0]).toBeNull();
      expect(child000.child[1]).not.toBeNull();
      const child0001 = <h.GeohashNode>child000.child[1];
      // 00010
      expect(child0001.child[0]).not.toBeNull();
      const child00010 = <h.GeohashNode>child0001.child[0];
      expect(child00010.isLeaf()).toBe(true);
      // 00011
      expect(child0001.child[1]).not.toBeNull();
      const child00011 = <h.GeohashNode>child0001.child[1];
      expect(child00011.isLeaf()).toBe(true);
      // 0010
      expect(child001.child[0]).not.toBeNull();
      expect(child001.child[1]).toBeNull();
      const child0010 = <h.GeohashNode>child001.child[0];
      // 00101
      expect(child0010.child[0]).toBeNull();
      expect(child0010.child[1]).not.toBeNull();
      const child00101 = <h.GeohashNode>child0010.child[1];
      expect(child00101.isLeaf()).toBe(true);
    });

    it("returns the same node that was passed in", () => {
      const root = new h.GeohashNode();
      const result = root.fromHash("6");
      expect(result).toBe(root);
    });
  });

  describe("bits", () => {
    it("returns the bitstring representation of the geohash", () => {
      const leaf = new h.GeohashNode()
        .makeChild(0)
        .makeChild(1)
        .makeChild(0)
        .makeChild(0)
        .makeChild(1);
      expect(leaf.bits()).toStrictEqual([0, 1, 0, 0, 1]);
    });
  });

  describe("get", () => {
    it("iterates through the leaf geohash nodes", () => {
      const root = new h.GeohashNode();
      const intermediate = root.makeChild(0).makeChild(1);
      const leaf1 = intermediate.makeChild(0).makeChild(1);
      const leaf2 = intermediate.makeChild(1);
      const leaf3 = root.makeChild(1);

      const iterator = root.get();
      expect(iterator.next().value).toBe(leaf1);
      expect(iterator.next().value).toBe(leaf2);
      expect(iterator.next().value).toBe(leaf3);
    });
  });

  describe("all", () => {
    it("returns all geohash strings with associated boxes", () => {
      const root = new h.GeohashNode()
        .fromHash("9q8")
        .fromHash("b")
        .fromHash("9q7");
      const hashes = root.all();
      expect(hashes["9q8"]).toStrictEqual(
        new g.Box([36.5625, -123.75, 37.96875, -122.34375])
      );
      expect(hashes["9q7"]).toStrictEqual(
        new g.Box([35.15625, -119.53125, 36.5625, -118.125])
      );
      expect(hashes["b"]).toStrictEqual(new g.Box([45, -180, 90, -135]));
    });
  });

  describe("hashes", () => {
    it("returns an array of all leaf geohashes in the tree", () => {
      const root = new h.GeohashNode()
        .fromHash("dqcjqc")
        .fromHash("dqcjr1")
        .fromHash("dqcjpx")
        .fromHash("dqc") // try to insert dqc as a leaf, but it's already there
        .fromHash("d7") // insert d7 as a leaf
        .fromHash("d7c"); // now d7 is no longer a leaf
      expect(root.hashes().sort()).toStrictEqual(
        ["dqcjqc", "dqcjr1", "dqcjpx", "d7c"].sort()
      );
    });
  });

  describe("boxes", () => {
    it("returns the bounds of all leaf geohashes in the tree", () => {
      const root = new h.GeohashNode()
        .fromHash("r0wv")
        .fromHash("r2") // insert r2 as a leaf
        .fromHash("r22u") // now r2 is not a leaf
        .fromHash("r281");
      const expected = [
        new g.Box([-41.308594, 144.49219, -41.132813, 144.84375]), // r0wv
        new g.Box([-42.890625, 147.30469, -42.714844, 147.65625]), // r22u
        new g.Box([-42.011719, 146.25, -41.835938, 146.60156]), //r281
      ].sort();
      const actual = root.boxes().sort();
      expect(actual).toHaveLength(expected.length);
      for (let i = 0; i < expected.length; ++i) {
        // use toBeCloseTo to account for floating point errors
        expect(actual[i].south).toBeCloseTo(actual[i].south);
        expect(actual[i].west).toBeCloseTo(actual[i].west);
        expect(actual[i].north).toBeCloseTo(actual[i].north);
        expect(actual[i].east).toBeCloseTo(actual[i].east);
      }
    });
  });

  // TODO: describe("cover", () => {});
});
