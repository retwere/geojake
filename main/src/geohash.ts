import { angMid, Box, Geometry } from "./geometry";

const GEOHASH_BIT_LENGTH = 5;
const CHAR_MAP = "0123456789bcdefghjkmnpqrstuvwxyz";

export function bitsToHash(bits: Array<0 | 1>): string {
  if (bits.length % GEOHASH_BIT_LENGTH !== 0)
    throw new Error("Invalid bit length: " + bits.length);

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

export function hashToBits(hash: string): Array<0 | 1> {
  const bits: Array<0 | 1> = [];
  for (let i = 0; i < hash.length; ++i) {
    const char = hash[i];
    const idx = CHAR_MAP.indexOf(char);
    for (let j = GEOHASH_BIT_LENGTH - 1; j >= 0; --j) {
      bits.push(<0 | 1>((idx >> j) & 1));
    }
  }
  return bits;
}

export type Geohashes = Record<string, Box>;

export class GeohashNode {
  box: Box;
  evenBit: boolean;
  parent: GeohashNode | null;
  childBoxes: [Box, Box];
  child: [GeohashNode | null, GeohashNode | null];
  constructor(
    box: Box = new Box([-90, -180, 90, 180]),
    evenBit = true,
    parent: GeohashNode | null = null
  ) {
    this.box = box;
    // evenBit == true:  child[0] == west,  child[1] == east
    // evenBit == false: child[0] == south, child[1] == north
    this.evenBit = evenBit;
    this.parent = parent;
    this.child = [null, null];
    if (this.evenBit) {
      // for even bits, split longitude in half
      const midLng = angMid(this.box.west, this.box.east);
      this.childBoxes = [
        new Box([this.box.south, this.box.west, this.box.north, midLng]),
        new Box([this.box.south, midLng, this.box.north, this.box.east]),
      ];
    } else {
      // for odd bits, split latitude in half
      const midLat = angMid(this.box.south, this.box.north);
      this.childBoxes = [
        new Box([this.box.south, this.box.west, midLat, this.box.east]),
        new Box([midLat, this.box.west, this.box.north, this.box.east]),
      ];
    }
  }

  isLeaf(): boolean {
    return this.child.every((x) => x === null);
  }

  isRoot(): boolean {
    return this.parent === null;
  }

  makeChild(bit: 0 | 1): GeohashNode {
    if (!this.child[bit]) {
      this.child[bit] = new GeohashNode(
        this.childBoxes[bit],
        !this.evenBit,
        this
      );
    }
    return <GeohashNode>this.child[bit];
  }

  cover(geometry: Geometry, precision: number): GeohashNode {
    if (precision === 0) return this;
    if (this.box.within(geometry) && precision % GEOHASH_BIT_LENGTH === 0)
      return this;
    this.childBoxes.map((box, i) => {
      if (geometry.intersectsBox(box)) {
        this.makeChild(<0 | 1>i).cover(geometry, precision - 1);
      }
    });
    return this;
  }

  fromBits(bits: Array<0 | 1>): GeohashNode {
    if (bits.length === 0) return this;
    const bit = bits[0];
    const rest = bits.slice(1);
    this.makeChild(bit).fromBits(rest);
    return this;
  }

  bits(): Array<0 | 1> {
    if (!this.parent) return [];
    return [...this.parent.bits(), <0 | 1>this.parent.child.indexOf(this)];
  }

  *get(): IterableIterator<[Array<0 | 1>, Box]> {
    if (this.isLeaf()) {
      yield [this.bits(), this.box];
    } else {
      if (this.child[0]) yield* this.child[0].get();
      if (this.child[1]) yield* this.child[1].get();
    }
  }

  all(): Geohashes {
    const output: Geohashes = {};
    for (const [bits, box] of this.get()) {
      output[bitsToHash(bits)] = box;
    }
    return output;
  }

  hashes(): Array<string> {
    return Object.keys(this.all());
  }

  boxes(): Array<Box> {
    return Object.values(this.all());
  }
}
