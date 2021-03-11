import { Box, Geometry } from "./geometry";
import {
  CHAR_MAP,
  GEOHASH_BIT_LENGTH,
  Geohash,
  GeohashError,
  GeohashNode,
  GeohashSet,
} from "./geohash";

export { Point, Box, Geometry } from "./geometry";
export { Geohash, GeohashSet, GeohashError } from "./geohash";

/**
 * A collection of geohashes that cover a Geometry. Each geohash is a box-shaped
 * region on the earth that can also be represented by an alphanumeric hash
 * string. The hashes are calculated by the method of Niemeyer (see
 * https://en.wikipedia.org/wiki/Geohash).
 */
export class Geohashes {
  private root: GeohashNode;
  private _all: GeohashSet | null;

  /**
   * The characters that may appear in a valid geohash string.
   */
  static GEOHASH_CHARS = CHAR_MAP;

  /**
   * Covers the given geometry with geohash boxes at the given precision. The
   * `precision` parameter is the maximum length of geohash string that can
   * result.
   */
  constructor(geometry: Geometry, precision: number) {
    this.root = new GeohashNode().cover(
      geometry,
      precision * GEOHASH_BIT_LENGTH
    );
    this._all = null;
  }

  /**
   * Iterates through the collection of geohashes, providing both the string
   * hash and the bounding box:
   *   \{ hash: "9q9j", box: Box([...]) \}
   *
   * @returns An iterator over geohash strings with corresponding boxes.
   */
  *get(): IterableIterator<Geohash> {
    yield* this.root.geohashes();
  }

  /**
   * Provides the set of geohashes as an object, with the hash strings as keys
   * and the corresponding bounding boxes as values:
   *   \{
   *     "9q9j": Box([...]),
   *     "9q9k": Box([...]),
   *     ...
   *   \}
   *
   * @returns A set of geohashes with hash strings and boxes.
   */
  get all(): GeohashSet {
    if (this._all) return this._all;
    this._all = {};
    for (const { hash, box } of this.get()) {
      this._all[hash] = box;
    }
    return this._all;
  }

  /**
   * Calculates the geographic rectangle encoded by a geohash string.
   *
   * @param hashStr - the geohash string to decode.
   * @returns The geographic `Box` corresponding to `hashStr`.
   *
   * @throws {@link GeohashError}
   * Thrown if `hashStr` contains any invalid characters.
   */
  static hashBox(hashStr: string): Box {
    const root = new GeohashNode().fromHash(hashStr);
    for (const { hash, box } of root.geohashes()) {
      if (hash === hashStr) return box;
    }
    GeohashError._internal(
      "Could not find hashBox for hashStr: '" + hashStr + "'"
    );
  }
}
