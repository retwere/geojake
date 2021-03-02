import * as g from "./geometry";
import * as h from "./geohash";

describe("bitsToHash", () => {
  it("converts an array of bits to a geohash string", () => {
    expect(
      h.bitsToHash([
        1,
        1,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        1,
        1,
        0,
        0,
        1,
        1,
        0,
        1,
        1,
        0,
        1,
        1,
        0,
        1,
        0,
        0,
      ])
    ).toBe("s01men");
  });
});

describe("hashToBits", () => {
  it("converts a geohash string to an array of bits", () => {
    expect(h.hashToBits("s01men")).toStrictEqual([
      1,
      1,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      1,
      1,
      0,
      0,
      1,
      1,
      0,
      1,
      1,
      0,
      1,
      1,
      0,
      1,
      0,
      0,
    ]);
  });
});

describe("GeohashNode", () => {
  describe("isLeaf", () => {
    it("determines whether a node is a leaf", () => {
      const root = new h.GeohashNode();
      const child = root.makeChild(0);
      expect(root.isLeaf()).toBeFalsy();
      expect(child.isLeaf()).toBeTruthy();
    });
  });

  describe("isRoot", () => {
    it("determines whether a node is the root", () => {
      const root = new h.GeohashNode();
      const child = root.makeChild(0);
      expect(root.isRoot()).toBeTruthy();
      expect(child.isRoot()).toBeFalsy();
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
});
