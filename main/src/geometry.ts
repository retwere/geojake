/**
 * Normalizes the given angle to [-180, 180].
 *
 * @param x - An angle
 * @returns The value of `x` normalized to [180, -180]
 */
export function angNormalize(x: number): number {
  x = x % 360;
  return x < -180 ? x + 360 : x > 180 ? x - 360 : x;
}

/**
 * Calculates the angular displacement from x to y in the CCW (eastward)
 * direction. The result is an angle in [0, 360].
 *
 * @param x - The starting angle
 * @param y - The ending angle
 * @returns The angular displacement from x to y
 */
export function angDisplacement(x: number, y: number): number {
  x = angNormalize(x);
  y = angNormalize(y);
  if (x > y) y += 360;
  return y - x;
}

/**
 * Determines whether an angle is between two others. That is, whether the angle
 * is in the region swept out from the start angle to the end angle in the CCW
 * (eastward) direction. Both the start and end angles are included in the
 * range.
 *
 * @param val - The angle to test
 * @param ang1 - The starting angle
 * @param ang2 - The ending angle
 * @returns True iff `val` is between `ang1` and `ang2`
 */
export function angBetween(val: number, ang1: number, ang2: number): boolean {
  if (
    (val === -180 || val === 180) &&
    (ang1 === 180 || ang1 === -180 || ang2 === 180 || ang2 === -180)
  ) {
    return true;
  }
  return angDisplacement(ang1, val) <= angDisplacement(ang1, ang2);
}

/**
 * Calculates the mid-angle of two angles. That is, the mid-angle of the region
 * swept out from the start angle to the end angle in the CCW (eastward)
 * direction.
 *
 * @param ang1 - The starting angle
 * @param ang2 - The ending angle
 * @returns The mid-angle between `ang1` and `ang2`
 */
export function angMid(ang1: number, ang2: number): number {
  return angNormalize(ang1 + angDisplacement(ang1, ang2) / 2);
}

/**
 * Normalizes a latitude to be in [-90, 90]. Values outside of the range are
 * snapped to -90 or 90.
 *
 * @param lat - A latitude
 * @returns The normalized latitude `lat`
 */
export function normalizeLat(lat: number): number {
  return lat > 90 ? 90 : lat < -90 ? -90 : lat;
}

/**
 * Normalizes a longitude to be in [-180, 180]. Values outside of the range are
 * normalized as angles.
 *
 * @param lng - A longitude
 * @returns The normalized longitude `lng`
 */
export function normalizeLng(lng: number): number {
  return angNormalize(lng);
}

/**
 * Represents a subset of the points on the earth.
 */
export interface Geometry {
  /**
   * Determines whether this geometry intersects with a given box.
   *
   * @param box - The box to test
   * @returns True iff this geometry intersects `box`
   */
  readonly intersectsBox: (box: Box) => boolean;

  /**
   * Determines whether this geometry completely contains a given box.
   *
   * @param box - The box to test
   * @returns True iff this geometry contains `box`
   */
  readonly containsBox: (box: Box) => boolean;
}

/**
 * Represents a singleton point on the surface of the earth.
 */
export class Point implements Geometry {
  /**
   * The latitude of this point.
   */
  readonly lat: number;

  /**
   * The longitude of this point
   */
  readonly lng: number;

  /**
   * Creates a point with the provided coordinates. The coordinates will be
   * normalized:
   *   * Latitudes are truncated to [-90, 90].
   *   * Longitudes are normalized to (-180,180].
   *   * At the poles (lat==+/-90), the longitude will be 0.
   *
   * @param coords - The `[lat, lng]` coordinates of the new point
   */
  constructor(coords: [number, number]) {
    const [lat, lng] = coords;
    this.lat = normalizeLat(lat);
    if (this.lat === 90 || this.lat === -90) this.lng = 0;
    else this.lng = normalizeLng(lng);
    if (this.lng === -180) this.lng = 180;
  }

  /**
   * Determines whether this point intersects with a given box. A point
   * intersects a box iff the box contains the point.
   *
   * @param box - The box to test
   * @returns True iff this point intersects `box`
   */
  intersectsBox(box: Box): boolean {
    return (
      (angBetween(this.lat, box.south, box.north) &&
        angBetween(this.lng, box.west, box.east)) ||
      (this.lat === 90 && box.north === 90) ||
      (this.lat === -90 && box.south === -90)
    );
  }

  /**
   * Determines whether this point completely contains a given box. A point can
   * never contain a box, so this function always returns false.
   *
   * @param box - The box to test
   * @returns True iff this point contains `box`
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  containsBox(box: Box): boolean {
    return false;
  }
}

/**
 * Represents a latitude/longitude range on the surface of the earth. That is,
 * the area swept out from south to north, and from west to east. Note that if
 * `west > east`, then the box is considered to cross the anti-meridian.
 */
export class Box implements Geometry {
  /**
   * The south latitude of the box.
   */
  readonly south: number;

  /**
   * The west longitude of the box.
   */
  readonly west: number;

  /**
   * The north latitude of the box.
   */
  readonly north: number;

  /**
   * The east longitude of the box.
   */
  readonly east: number;

  /**
   * Constructs a box with the provided bounds.
   *
   * @param bounds - The `[south, west, north, east]` bounds of the box
   */
  constructor(bounds: [number, number, number, number]) {
    const [south, west, north, east] = bounds;
    this.south = normalizeLat(south);
    this.west = normalizeLng(west);
    this.north = normalizeLat(north);
    this.east = normalizeLng(east);
  }

  /**
   * Determines whether this box intersects the given box.
   *
   * @param box - The box to test
   * @returns True iff this box intersects `box`
   */
  intersectsBox(box: Box): boolean {
    return (
      ((angBetween(this.south, box.south, box.north) ||
        angBetween(box.south, this.south, this.north) ||
        angBetween(this.north, box.south, box.north) ||
        angBetween(box.north, this.south, this.north)) &&
        (angBetween(this.west, box.west, box.east) ||
          angBetween(box.west, this.west, this.east) ||
          angBetween(this.east, box.west, box.east) ||
          angBetween(box.east, this.west, this.east))) ||
      (this.south === -90 && box.south === -90) ||
      (this.north === 90 && box.north === 90)
    );
  }

  /**
   * Determines whether this box contains the given box.
   *
   * @param box - The box to test
   * @returns True iff this box contains `box`
   */
  containsBox(box: Box): boolean {
    return (
      angBetween(box.south, this.south, this.north) &&
      angBetween(box.north, this.south, this.north) &&
      angBetween(box.west, this.west, this.east) &&
      angBetween(box.east, this.west, this.east)
    );
  }

  /**
   * Determines whether this box is contained within the given geometry.
   *
   * @param geometry - The geometry to test
   * @returns True iff this box is within `geometry`
   */
  within(geometry: Geometry): boolean {
    return geometry.containsBox(this);
  }
}
