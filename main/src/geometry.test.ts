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
    // especially test the case lng == +/-180
    expect(g.angBetween(180, 10, -10)).toBe(true);
    expect(g.angBetween(-180, 170, 180)).toBe(true);
    expect(g.angBetween(180, 170, 180)).toBe(true);
    expect(g.angBetween(-180, -180, -170)).toBe(true);
    expect(g.angBetween(180, -180, -170)).toBe(true);
  });
});

describe("angMid", () => {
  it("finds the middle of the range swept out CCW by two angles", () => {
    expect(g.angMid(1, 3)).toBeCloseTo(2);
    expect(g.angMid(-3, -1)).toBeCloseTo(-2);
    expect(g.angMid(7, 7)).toBeCloseTo(7);
    expect(g.angMid(-10, 10)).toBeCloseTo(0);
    expect(g.angMid(-179, 179)).toBeCloseTo(0);
    expect(g.angMid(10, -10)).toBeCloseTo(180);
    expect(g.angMid(179, -179)).toBeCloseTo(180);
    expect(g.angMid(180, 180)).toBeCloseTo(180);
    expect(g.angMid(180, -180)).toBeCloseTo(180);
    expect(g.angMid(-180, 180)).toBeCloseTo(0);
  });
});

describe("normalizeLat", () => {
  it("restricts the latitude to [-90,90]", () => {
    expect(g.normalizeLat(75)).toBeCloseTo(75);
    expect(g.normalizeLat(-1)).toBeCloseTo(-1);
    expect(g.normalizeLat(-90)).toBeCloseTo(-90);
    expect(g.normalizeLat(90)).toBeCloseTo(90);
    expect(g.normalizeLat(-91)).toBeCloseTo(-90);
    expect(g.normalizeLat(180)).toBeCloseTo(90);
  });
});

describe("normalizeLng", () => {
  it("normalizes the longitude to [-180,180]", () => {
    expect(g.normalizeLng(90)).toBeCloseTo(90);
    expect(g.normalizeLng(0)).toBeCloseTo(0);
    expect(g.normalizeLng(180)).toBeCloseTo(180);
    expect(g.normalizeLng(-180)).toBeCloseTo(-180);
    expect(g.normalizeLng(181)).toBeCloseTo(-179);
    expect(g.normalizeLng(-200)).toBeCloseTo(160);
  });
});

describe("Point", () => {
  describe("intersectsBox", () => {
    it("identifies whether the point is inside the box", () => {
      expect(new g.Point([1, 1]).intersectsBox(new g.Box([0, 0, 10, 10]))).toBe(
        true
      );
      expect(
        new g.Point([-1, 1]).intersectsBox(new g.Box([0, 0, 10, 10]))
      ).toBe(false);
      expect(
        new g.Point([-1, -1]).intersectsBox(new g.Box([0, 0, 10, 10]))
      ).toBe(false);
      expect(
        new g.Point([1, -1]).intersectsBox(new g.Box([0, 0, 10, 10]))
      ).toBe(false);
      expect(
        new g.Point([50, 50]).intersectsBox(new g.Box([0, 0, 10, 10]))
      ).toBe(false);
    });

    it("identifies when a pole is in a box", () => {
      expect(
        new g.Point([90, 0]).intersectsBox(new g.Box([0, 10, 90, 20]))
      ).toBe(true);
      expect(
        new g.Point([-90, 0]).intersectsBox(new g.Box([-90, -20, 0, -10]))
      ).toBe(true);
      expect(
        new g.Point([90, 0]).intersectsBox(new g.Box([88, -180, 90, 180]))
      ).toBe(true);
      expect(
        new g.Point([90, 0]).intersectsBox(new g.Box([-90, -20, 0, -10]))
      ).toBe(false);
      expect(
        new g.Point([-90, 0]).intersectsBox(new g.Box([0, 10, 90, 20]))
      ).toBe(false);
      // even if the pole is specified with a lng outside the range
      expect(
        new g.Point([90, 50]).intersectsBox(new g.Box([0, 10, 90, 20]))
      ).toBe(true);
    });

    describe("identifies when a point on the antimeridian is in a box", () => {
      // especially test that we handle +/-180 correctly
      it("if the point is on the vertical edge of the box", () => {
        expect(
          new g.Point([10, 180]).intersectsBox(new g.Box([5, 170, 15, 180]))
        ).toBe(true);
        expect(
          new g.Point([10, -180]).intersectsBox(new g.Box([5, 170, 15, 180]))
        ).toBe(true);
        expect(
          new g.Point([10, 180]).intersectsBox(new g.Box([5, -180, 15, -170]))
        ).toBe(true);
        expect(
          new g.Point([10, -180]).intersectsBox(new g.Box([5, -180, 15, -170]))
        ).toBe(true);
      });

      it("if the point is on the horizontal edge of the box", () => {
        expect(
          new g.Point([10, 180]).intersectsBox(new g.Box([10, 170, 20, -170]))
        ).toBe(true);
        expect(
          new g.Point([10, -180]).intersectsBox(new g.Box([0, 170, 10, -179]))
        ).toBe(true);
        // This one goes the other way 'round.
        expect(
          new g.Point([10, 180]).intersectsBox(new g.Box([10, -170, 15, 170]))
        ).toBe(false);
        expect(
          new g.Point([-10, -180]).intersectsBox(new g.Box([-10, 160, 0, -178]))
        ).toBe(true);
      });

      it("if the point is on the corner of the box", () => {
        expect(
          new g.Point([60, 180]).intersectsBox(new g.Box([60, -180, 65, -160]))
        ).toBe(true);
        expect(
          new g.Point([60, -180]).intersectsBox(new g.Box([60, -180, 65, -160]))
        ).toBe(true);
        expect(
          new g.Point([0, 180]).intersectsBox(new g.Box([-55, 170, 10, 180]))
        ).toBe(true);
        expect(
          new g.Point([0, -180]).intersectsBox(new g.Box([-55, 170, 10, 180]))
        ).toBe(true);
      });

      it("if the point is in the interior of the box", () => {
        expect(
          new g.Point([-33.3, -180]).intersectsBox(
            new g.Box([-40, 170, -30, -179])
          )
        ).toBe(true);
        expect(
          new g.Point([-33.3, 180]).intersectsBox(
            new g.Box([-40, 170, -30, -179])
          )
        ).toBe(true);
        expect(
          new g.Point([-33.3, -180]).intersectsBox(
            new g.Box([-40, -170, -30, 179])
          )
        ).toBe(false);
        expect(
          new g.Point([-33.3, 180]).intersectsBox(
            new g.Box([-40, -170, -30, 179])
          )
        ).toBe(false);
      });
    });
  });

  describe("containsBox", () => {
    it("never returns true", () => {
      expect(new g.Point([0, 0]).containsBox(new g.Box([15, 10, 50, 94]))).toBe(
        false
      );
      expect(new g.Point([0, 0]).containsBox(new g.Box([0, 0, 0, 0]))).toBe(
        false
      );
    });
  });
});

describe("Box", () => {
  describe("intersectsBox", () => {
    it("determines if two boxes intersect", () => {
      expect(
        new g.Box([-1, -1, 1, 1]).intersectsBox(new g.Box([-2, -2, 2, 2]))
      ).toBe(true);
      expect(
        new g.Box([-1, -1, 1, 1]).intersectsBox(new g.Box([10, 10, 20, 20]))
      ).toBe(false);
      expect(
        new g.Box([-1, -1, 1, 1]).intersectsBox(new g.Box([-2, -2, 2, -1.5]))
      ).toBe(false);
      expect(
        new g.Box([-1, -1, 1, 1]).intersectsBox(new g.Box([-2, -2, -1.5, 2]))
      ).toBe(false);
    });

    it("determines if two boxes intersect at a pole", () => {
      expect(
        new g.Box([0, 0, 90, 1]).intersectsBox(new g.Box([0, 10, 90, 11]))
      ).toBe(true);
      expect(
        new g.Box([-90, -1, -80, 1]).intersectsBox(
          new g.Box([-90, -170, -80, -160])
        )
      ).toBe(true);
    });

    describe("determines if two boxes intersect at the antimeridian", () => {
      it("if one or both boxes cross the meridian", () => {
        expect(
          new g.Box([-10, 170, 10, -170]).intersectsBox(
            new g.Box([-8, 160, 15, -170])
          )
        ).toBe(true);
        expect(
          new g.Box([-10, 170, 10, -170]).intersectsBox(
            new g.Box([-8, 177, -2, 178])
          )
        ).toBe(true);
      });

      it("if both boxes touch the meridian from opposite sides", () => {
        expect(
          new g.Box([-10, -180, 10, -170]).intersectsBox(
            new g.Box([-8, 160, 15, 180])
          )
        ).toBe(true);
      });
    });
  });

  describe("containsBox", () => {
    it("determines if one box is contained in another", () => {
      expect(
        new g.Box([-2, -2, 2, 2]).containsBox(new g.Box([-1, -1, 1, 1]))
      ).toBe(true);
      expect(
        new g.Box([-2, -2, 2, 2]).containsBox(new g.Box([-1, -1, 17, 1]))
      ).toBe(false);
    });

    it("decides if a box crossing the antimeridian contains a box", () => {
      expect(
        new g.Box([-10, 170, 20, -170]).containsBox(
          new g.Box([-9, 171, 10, -171])
        )
      ).toBe(true);
      expect(
        new g.Box([-10, 170, 20, -170]).containsBox(
          new g.Box([-9, 171, 10, 172])
        )
      ).toBe(true);
      // this one goes the long way around
      expect(
        new g.Box([-10, -170, 20, 170]).containsBox(
          new g.Box([-9, 171, 10, 172])
        )
      ).toBe(false);
    });
  });

  describe("within", () => {
    it("determines if the box is contained within another geometry", () => {
      expect(
        new g.Box([0, -8, 10, 8]).within(new g.Box([-90, -180, 90, 180]))
      ).toBe(true);
      expect(new g.Box([0, -8, 10, 8]).within(new g.Point([0, 0]))).toBe(false);
      expect(new g.Box([0, 0, 0, 0]).within(new g.Point([0, 0]))).toBe(false);
    });
  });
});
