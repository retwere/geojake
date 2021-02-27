import * as g from "./geometry";

describe("angNormalize", () => {
  it("normalizes an angle to be in [-180, 180]", () => {
    // using toBeCloseTo for floating point values
    expect(g.angNormalize(75)).toBeCloseTo(75);
    expect(g.angNormalize(0)).toBeCloseTo(0);
    expect(g.angNormalize(-75)).toBeCloseTo(-75);
    expect(g.angNormalize(-180)).toBeCloseTo(-180);
    expect(g.angNormalize(180)).toBeCloseTo(180);
    expect(g.angNormalize(-181)).toBeCloseTo(179);
    expect(g.angNormalize(-361)).toBeCloseTo(-1);
    expect(g.angNormalize(361)).toBeCloseTo(1);
  });
});

describe("angDisplacement", () => {
  it("calculates displacement from x to y in the CCW direction, in [0, 360]", () => {
    // using toBeCloseTo for floating point values
    expect(g.angDisplacement(0, 10)).toBeCloseTo(10);
    expect(g.angDisplacement(-10, 10)).toBeCloseTo(20);
    expect(g.angDisplacement(-10, 0)).toBeCloseTo(10);
    expect(g.angDisplacement(10, 0)).toBeCloseTo(350);
    expect(g.angDisplacement(179, -179)).toBeCloseTo(2);
    expect(g.angDisplacement(-179, 179)).toBeCloseTo(358);
    expect(g.angDisplacement(1, 2)).toBeCloseTo(1);
    expect(g.angDisplacement(2, 1)).toBeCloseTo(359);
    expect(g.angDisplacement(-180, 180)).toBeCloseTo(360);
  });
});

describe("angBetween", () => {
  it("determines if angle0 is between angle1 and angle2 (as one goes in CCW direction)", () => {
    expect(g.angBetween(0, -10, 10)).toBe(true);
    expect(g.angBetween(10, -10, 10)).toBe(true);
    expect(g.angBetween(0, 10, -10)).toBe(false);
    expect(g.angBetween(180, 10, -10)).toBe(true);
  });
});

describe("angMid", () => {
  it("finds the middle of the range swept out CCW by two angles", () => {
    expect(g.angMid(1, 3)).toBeCloseTo(2);
    expect(g.angMid(-3, -1)).toBeCloseTo(-2);
    expect(g.angMid(-10, 10)).toBeCloseTo(0);
    expect(g.angMid(-179, 179)).toBeCloseTo(0);
    expect(g.angMid(10, -10)).toBeCloseTo(180);
    expect(g.angMid(179, -179)).toBeCloseTo(180);
    expect(g.angMid(179, -179)).toBeCloseTo(180);
  });
});
