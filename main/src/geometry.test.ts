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
