export function angNormalize(x: number) {
  // Place angle in [-180, 180].
  x = x % 360;
  return x < -180 ? x + 360 : x > 180 ? x - 360 : x;
}

export function angDisplacement(x: number, y: number) {
  // Calculate the displacement from x to y in the CCW (eastward) direction.
  // Result is an angle in [0, 360].
  x = angNormalize(x);
  y = angNormalize(y);
  if (x > y) y += 360;
  return y - x;
}

export function angBetween(val: number, ang1: number, ang2: number) {
  // is val between ang1 and ang2
  return angDisplacement(ang1, val) <= angDisplacement(ang1, ang2);
}

export function angMid(ang1: number, ang2: number) {
  return angNormalize(ang1 + angDisplacement(ang1, ang2) / 2);
}

export function normalizeLat(lat: number) {
  return lat > 90 ? 90 : lat < -90 ? -90 : lat;
}

export function normalizeLng(lng: number) {
  return angNormalize(lng);
}

export interface Geometry {
  intersectsBox: (box: Box) => boolean;
  containsBox: (box: Box) => boolean;
}

export class Point implements Geometry {
  lat: number;
  lng: number;
  constructor(coords: [number, number]) {
    const [lat, lng] = coords;
    this.lat = normalizeLat(lat);
    this.lng = normalizeLng(lng);
  }

  intersectsBox(box: Box) {
    return (
      (angBetween(this.lat, box.south, box.north) &&
        angBetween(this.lng, box.west, box.east)) ||
      (this.lat === 90 && box.north === 90) ||
      (this.lat === -90 && box.south === -90)
    );
  }

  containsBox(box: Box) {
    return false;
  }
}

export class Box implements Geometry {
  south: number;
  west: number;
  north: number;
  east: number;
  constructor(bounds: [number, number, number, number]) {
    const [south, west, north, east] = bounds;
    this.south = normalizeLat(south);
    this.west = normalizeLng(west);
    this.north = normalizeLat(north);
    this.east = normalizeLng(east);
  }

  intersectsBox(box: Box) {
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

  containsBox(box: Box) {
    return (
      angBetween(box.south, this.south, this.north) &&
      angBetween(box.north, this.south, this.north) &&
      angBetween(box.west, this.west, this.east) &&
      angBetween(box.east, this.west, this.east)
    );
  }

  within(geometry: Geometry) {
    return geometry.containsBox(this);
  }
}
