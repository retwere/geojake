import { angMid, Box, Geometry } from "./geometry";

const GEOHASH_BIT_LENGTH = 5;
const CHAR_MAP = "0123456789bcdefghjkmnpqrstuvwxyz";

/**
 * A `bit` can be `0` or `1`.
 */
export type bit = 0 | 1;

/**
 * A collection of geohash strings paired with the boxes that represent their
 * bounds.
 */
export type Geohashes = Record<string, Box>;

/**
 * Represents an error that occurred during geohashing.
 */
export class GeohashError extends Error {
  constructor(message: string) {
    super("Geohash Error: " + message);
    this.name = "GeohashError";
  }
}

/**
 * Converts an array of bits to a geohash string.
 *
 * @param bits - an array of bits
 * @returns The geohash string representation of `bits`
 *
 * @throws {@link GeohashError}
 * Thrown if the length of `bits` is not divisible by `GEOHASH_BIT_LENGTH`.
 */
export function bitsToHash(bits: Array<bit>): string {
  if (bits.length % GEOHASH_BIT_LENGTH !== 0)
    throw new GeohashError(
      `Invalid bit length: ${
        bits.length % GEOHASH_BIT_LENGTH
      } != ${GEOHASH_BIT_LENGTH}`
    );

  let idx = 0; // index into CHAR_MAP
  let geohash = "";
  for (let i = 0; i < bits.length; ++i) {
    idx = idx * 2 + bits[i];
    if ((i + 1) % GEOHASH_BIT_LENGTH === 0) {
      geohash = geohash.concat(CHAR_MAP[idx]);
      idx = 0;
    }
  }
  return geohash;
}

/**
 * Converts a geohash string to an array of bits.
 *
 * @param hash - A geohash string
 * @returns The representation of `hash` as an array of bits.
 *
 * @throws {@link GeohashError}
 * Thrown if `hash` contains an invalid geohash character.
 */
export function hashToBits(hash: string): Array<bit> {
  const bits: Array<bit> = [];
  for (let i = 0; i < hash.length; ++i) {
    const char = hash[i];
    const idx = CHAR_MAP.indexOf(char);
    if (idx === -1)
      throw new GeohashError(`Invalid geohash character: ${char}`);
    for (let j = GEOHASH_BIT_LENGTH - 1; j >= 0; --j) {
      bits.push(<bit>((idx >> j) & 1));
    }
  }
  return bits;
}

/**
 * Represents a node in a geohash tree. Each node in the tree represents a
 * 1-bit geohash, with corresponding bounds. The collection of leaf nodes in the
 * tree is a set of geohashes.
 *
 * Each node in a chain from the root to a node `x` represents a bit in the
 * bitstring representation of the geohash `x`, with the root representing the
 * empty bitstring. The sequence of bits may be obtained by walking the tree
 * from the root to `x` and emitting the index (in the `child` array) of each
 * child node traversed.
 */
export class GeohashNode {
  /**
   * A box that represents the bounds of this geohash.
   */
  readonly box: Box;

  /**
   * Whether this node corresponds to an even or odd position in the bitstring.
   */
  readonly evenBit: boolean;

  /**
   * The parent of this node in the tree. This is null iff this node is the root
   * of the tree.
   */
  readonly parent: GeohashNode | null;

  /**
   * The child nodes of this node in the tree. The index of the child is the
   * value of the bit that the child corresponds to.
   *
   * Note that the interpretation of the index depends on `evenBit`:
   *   If `evenBit == true`, then `child[0] == west` and `child[1] == east`.
   *   If `evenBit == false`, then `child[0] == south` and `child[1] == north`.
   */
  child: [GeohashNode | null, GeohashNode | null];

  /**
   * Constructs a new `GeohashNode` with the provided bounds. Constructs a new
   * root node when called with the default parameters.
   *
   * @param box - The bounds of the geohash
   * @param evenBit - True iff this geohash corresponds to an even bit
   * @param parent - The parent `GeohashNode` of this node
   * @returns A new `GeohashNode` with the provided parameters
   */
  constructor(
    box: Box = new Box([-90, -180, 90, 180]),
    evenBit = true,
    parent: GeohashNode | null = null
  ) {
    this.box = box;
    this.evenBit = evenBit;
    this.parent = parent;
    this.child = [null, null];
  }

  /**
   * Determines if this node is a leaf.
   *
   * @returns True iff this node is a leaf
   */
  isLeaf(): boolean {
    return this.child.every((x) => x === null);
  }

  /**
   * Determines if this node is the root node of a tree.
   *
   * @returns True iff this node is a root
   */
  isRoot(): boolean {
    return this.parent === null;
  }

  /**
   * Determines the bounds for the indicated child.
   *
   * @param bit - Which child to find bounds for
   * @returns A box representation of the bounds of the child hash
   */
  subHashBox(bit: bit): Box {
    if (this.evenBit) {
      // for even bits, split longitude in half
      const midLng = angMid(this.box.west, this.box.east);
      if (bit === 0) {
        return new Box([this.box.south, this.box.west, this.box.north, midLng]);
      } else {
        return new Box([this.box.south, midLng, this.box.north, this.box.east]);
      }
    } else {
      // for odd bits, split latitude in half
      const midLat = angMid(this.box.south, this.box.north);
      if (bit === 0) {
        return new Box([this.box.south, this.box.west, midLat, this.box.east]);
      } else {
        return new Box([midLat, this.box.west, this.box.north, this.box.east]);
      }
    }
  }

  /**
   * Adds a child to this node. Automatically determines the bounds for the
   * child node based on this node's bounds.
   *
   * @param bit - Which child to create
   * @returns The new child node
   */
  makeChild(bit: bit): GeohashNode {
    if (!this.child[bit]) {
      this.child[bit] = new GeohashNode(
        this.subHashBox(bit),
        !this.evenBit,
        this
      );
    }
    return <GeohashNode>this.child[bit];
  }

  /**
   * Covers the given geometry with geohash boxes at the given precision. When
   * called on a node other than the root, only sub-hashes of this hash will be
   * calculated. The `precision` parameter is the length of the resulting
   * geohash string; the number of bits is `precision * GEOHASH_BIT_LENGTH`.
   *
   * @param geometry - The geometry to cover
   * @param precision - The precision of the geohashes
   * @returns This node, possibly with new children
   */
  cover(geometry: Geometry, precision: number): GeohashNode {
    if (precision === 0) return this;
    if (this.box.within(geometry) && precision % GEOHASH_BIT_LENGTH === 0)
      return this;

    const childBoxes = [this.subHashBox(0), this.subHashBox(1)];
    childBoxes.map((box, i) => {
      if (geometry.intersectsBox(box)) {
        this.makeChild(<bit>i).cover(geometry, precision - 1);
      }
    });
    return this;
  }

  /**
   * Add children to this node (and its descendents) corresponding to the
   * provided bitstring.
   *
   * @param bits - A bitstring
   * @returns This node, with new children corresponding to `bits`
   */
  fromBits(bits: Array<bit>): GeohashNode {
    if (bits.length === 0) return this;
    const bit = bits[0];
    const rest = bits.slice(1);
    this.makeChild(bit).fromBits(rest);
    return this;
  }

  /**
   * Add children to this node (and its descendents) corresponding to the
   * provided geohash string.
   *
   * @param hash - A geohash string
   * @returns This node, with new children corresponding to `hash`
   */
  fromHash(hash: string): GeohashNode {
    const bits = hashToBits(hash);
    return this.fromBits(bits);
  }

  /**
   * Calculates the bitstring representation of this geohash.
   *
   * @returns The bitstring representation of this geohash as an array of bits
   */
  bits(): Array<bit> {
    if (!this.parent) return [];
    return [...this.parent.bits(), <bit>this.parent.child.indexOf(this)];
  }

  /**
   * Provides an iterator that iterates through the leaf-level sub-geohashes of
   * this node. Both the bitstring representation and the corresponding box are
   * returned.
   *
   * @returns An iterator that iterates the sub-hashes of this node
   */
  *get(): IterableIterator<[Array<bit>, Box]> {
    if (this.isLeaf()) {
      yield [this.bits(), this.box];
    } else {
      if (this.child[0]) yield* this.child[0].get();
      if (this.child[1]) yield* this.child[1].get();
    }
  }

  /**
   * Returns geohash strings with corresponding boxes for all leaf-level
   * sub-hashes of this node.
   *
   * @returns A set of geohash strings with corresponding boxes
   */
  all(): Geohashes {
    const output: Geohashes = {};
    for (const [bits, box] of this.get()) {
      output[bitsToHash(bits)] = box;
    }
    return output;
  }

  /**
   * Returns all geohash strings for leaf-level sub-hashes of this node.
   *
   * @returns A set of geohash strings
   */
  hashes(): Array<string> {
    return Object.keys(this.all());
  }

  /**
   * Returns all geohash boxes for leaf-level sub-hashes of this node.
   *
   * @returns a set of boxes
   */
  boxes(): Array<Box> {
    return Object.values(this.all());
  }
}
