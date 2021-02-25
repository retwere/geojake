function angNormalize(x: number) {
    // Place angle in [-180, 180].
    x = x % 360;
    return x < -180 ? x + 360 : x > 180 ? x - 360 : x;
}

function angDisplacement(x: number, y: number) {
    // Calculate the displacement from x to y in the CCW (eastward) direction.
    // Result is an angle in [0, 360].
    x = angNormalize(x);
    y = angNormalize(y);
    if (x > y) y += 360;
    return y - x;
}

function angBetween(val: number, ang1: number, ang2: number) {
    // is val between ang1 and ang2
    return angDisplacement(ang1, val) <= angDisplacement(ang1, ang2);
}

function angMid(ang1: number, ang2: number) {
    return angNormalize(ang1 + angDisplacement(ang1, ang2) / 2);
}

function normalizeLat(lat: number) {
    return lat > 90 ? 90 : lat < -90 ? -90 : lat;
}

function normalizeLng(lng: number) {
    return angNormalize(lng);
}
