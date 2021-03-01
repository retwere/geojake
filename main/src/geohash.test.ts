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
    expect(h.hashToBits("s01men")).toBe([
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
