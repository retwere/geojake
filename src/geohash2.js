function angNormalize(x) {
    // Place angle in [-180, 180].
    x = x % 360;
    return x < -180 ? x + 360 :
        x > 180 ? x - 360 :
        x;
}

console.log(angNormalize(-180)) // -180
console.log(angNormalize(-181)) // 179
console.log(angNormalize(-361)) // -1
console.log(angNormalize(361)) // 1
console.log(angNormalize(180)) // 180

function angDisplacement(x, y) {
    // Calculate the displacement from x to y in the CCW (eastward) direction.
    // Result is an angle in [0, 360].
    x = angNormalize(x);
    y = angNormalize(y);
    if (x > y) y += 360;
    return (y - x);
}

console.log(angDisplacement(0, 10)) // 10
console.log(angDisplacement(-10, 10)) // 20
console.log(angDisplacement(-10, 0)) // 10
console.log(angDisplacement(10, 0)) // 350
console.log(angDisplacement(179, -179)) // 2
console.log(angDisplacement(-179, 179)) // 358
console.log(angDisplacement(1, 2)) // 1
console.log(angDisplacement(2, 1)) // 359
console.log(angDisplacement(-180,180)) // 360

function angBetween(val, ang1, ang2) {
    // is val between ang1 and ang2
    return angDisplacement(ang1, val) <= angDisplacement(ang1, ang2);
}

console.log(angBetween(0, -10, 10)) // true
console.log(angBetween(10, -10, 10)) // true
console.log(angBetween(0, 10, -10)) // false
console.log(angBetween(180, 10, -10)) // true

function angMid(ang1, ang2) {
    return angNormalize(ang1 + angDisplacement(ang1, ang2) / 2);
}

console.log(angMid(1, 3)) // 2
console.log(angMid(-3, -1)) // -2
console.log(angMid(-10, 10)) // 0
console.log(angMid(10, -10)) // 180
console.log(angMid(-179, 179)) // 0
console.log(angMid(179, -179)) // 180
console.log(angMid(179, -179)) // 180

function normalizeLat(lat) {
    return lat > 90 ? 90 : lat < -90 ? -90 : lat;
}

function normalizeLng(lng) {
    return angNormalize(lng);
}


class Point {
    constructor(coords) {
        const [lat, lng] = coords;
        this.lat = normalizeLat(lat);
        this.lng = normalizeLng(lng);
    }

    intersectsBox(box) {
        return (angBetween(this.lat, box.south, box.north) &&
                angBetween(this.lng, box.west, box.east)) ||
            (this.lat === 90 && box.north === 90) ||
            (this.lat ===-90 && box.south ===-90);
    }

    containsBox(box) {
        return false;
    }
}

class Box {
    constructor(bounds) {
        const [south, west, north, east] = bounds;
        this.south = normalizeLat(south);
        this.west = normalizeLng(west);
        this.north = normalizeLat(north);
        this.east = normalizeLng(east);
    }

    intersectsBox(box) {
        return ((angBetween(this.south, box.south, box.north) ||
                 angBetween(box.south, this.south, this.north) ||
                 angBetween(this.north, box.south, box.north) ||
                 angBetween(box.north, this.south, this.north)) &&
                (angBetween(this.west, box.west, box.east) ||
                 angBetween(box.west, this.west, this.east) ||
                 angBetween(this.east, box.west, box.east) ||
                 angBetween(box.east, this.west, this.east))) ||
            (this.south ===-90 && box.south ===-90) ||
            (this.north === 90 && box.north === 90);
    }

    containsBox(box) {
        return (angBetween(box.south, this.south, this.north) &&
                angBetween(box.north, this.south, this.north) &&
                angBetween(box.west, this.west, this.east) &&
                angBetween(box.east, this.west, this.east));
    }

    within(geometry) {
        return geometry.containsBox(this);
    }
}

console.log(new Point([1,1]).intersectsBox(new Box([0,0,10,10]))) //true
console.log(new Point([-1,1]).intersectsBox(new Box([0,0,10,10]))) //false
console.log(new Point([-1,-1]).intersectsBox(new Box([0,0,10,10]))) //false
console.log(new Point([1,-1]).intersectsBox(new Box([0,0,10,10]))) //false
console.log(new Point([50,50]).intersectsBox(new Box([0,0,10,10]))) //false
console.log(new Point([90,0]).intersectsBox(new Box([0,10,90,20]))) //true
console.log(new Point([-90,0]).intersectsBox(new Box([-90,-20,0,-10]))) //true
console.log(new Point([90,0]).intersectsBox(new Box([-90,-20,0,-10]))) //false
console.log(new Point([-90,0]).intersectsBox(new Box([0,10,90,20]))) //false


console.log(new Box([-1,-1,1,1]).intersectsBox(new Box([-2,-2,2,2]))) //true
console.log(new Box([-1,-1,1,1]).intersectsBox(new Box([10,10,20,20]))) //false
console.log(new Box([0,0,90,1]).intersectsBox(new Box([0,10,90,11]))) //true
console.log(new Box([-90,-1,-80,1]).intersectsBox(new Box([-90,-170,-80,-160]))) //true
console.log(new Box([-1,-1,1,1]).intersectsBox(new Box([-2,-2,2,-1.5]))) //false
console.log(new Box([-1,-1,1,1]).intersectsBox(new Box([-2,-2,-1.5,2]))) //false

console.log(new Box([-1,-1,1,1]).within(new Box([-2,-2,2,2]))) //true


const GEOHASH_BIT_LENGTH = 5;
const CHAR_MAP = '0123456789bcdefghjkmnpqrstuvwxyz';

function bitsToHash(bits) {
    if (bits.length % GEOHASH_BIT_LENGTH !== 0)
        throw new Error("Invalid bit length: " + bits.length);

    let idx = 0; // index into CHAR_MAP
    let geohash = "";
    for (let i = 0; i < bits.length; ++i) {
        idx = idx*2 + bits[i];
        if ((i+1) % GEOHASH_BIT_LENGTH === 0) {
            geohash = geohash.concat(CHAR_MAP[idx]);
            idx = 0;
        }
    }
    return geohash;
}

console.log(bitsToHash(
    [ 1, 1, 0, 0, 0,
      0, 0, 0, 0, 0,
      0, 0, 0, 0, 1,
      1, 0, 0, 1, 1,
      0, 1, 1, 0, 1,
      1, 0, 1, 0, 0 ])); // s01men

function hashToBits(hash) {
    let bits = [];
    for (let i = 0; i < hash.length; ++i) {
        let char = hash[i];
        let idx = CHAR_MAP.indexOf(char);
        for (j = GEOHASH_BIT_LENGTH - 1; j >= 0; --j) {
            bits.push(idx >> j & 1);
        }
    }
    return bits;
}

console.log(hashToBits("s01men")); // 11000 00000 00001 10011 01101 10100


class GeohashNode {
    constructor(
        box = new Box([-90, -180, 90, 180]),
        evenBit = true,
        parent = null) {
        this.box = box;
        // evenBit == true:  child[0] == west,  child[1] == east
        // evenBit == false: child[0] == south, child[1] == north
        this.evenBit = evenBit;
        this.parent = parent;
        this.child = new Array(2).fill(null);

        this.childBoxes = new Array(2).fill(null);
        if (this.evenBit) {
            // for even bits, split longitude in half
            const midLng = angMid(this.box.west, this.box.east);
            this.childBoxes[0] = new Box(
                [this.box.south, this.box.west, this.box.north, midLng]);
            this.childBoxes[1] = new Box(
                [this.box.south, midLng, this.box.north, this.box.east]);
        } else {
            // for odd bits, split latitude in half
            const midLat = angMid(this.box.south, this.box.north);
            this.childBoxes[0] = new Box(
                [this.box.south, this.box.west, midLat, this.box.east]);
            this.childBoxes[1] = new Box(
                [midLat, this.box.west, this.box.north, this.box.east]);
        }
    }

    isLeaf() {
        return this.child.every((x) => x===null);
    }

    isRoot() {
        return this.parent === null;
    }

    makeChild(bit) {
        if (!this.child[bit])
            this.child[bit] = new GeohashNode(
                this.childBoxes[bit], !this.evenBit, this);
        return this.child[bit];
    }

    cover(geometry, precision) {
        if (precision === 0)
            return this;
        if (this.box.within(geometry) && precision % GEOHASH_BIT_LENGTH === 0)
            return this;
        this.childBoxes.map((box, i) => {
            if (geometry.intersectsBox(box)) {
                this.makeChild(i).cover(geometry, precision - 1);
            }
        });
        return this;
    }

    fromBits(bits) {
        if (bits.length === 0) return this;
        let bit = bits[0];
        let rest = bits.slice(1);
        this.makeChild(bit).fromBits(rest);
        return this;
    }

    bits() {
        if (!this.parent) return [];
        return [...this.parent.bits(), this.parent.child.indexOf(this)];
    }

    * get() {
        if (this.isLeaf()) {
            yield [this.bits(), this.box];
        } else {
            if (this.child[0]) yield * this.child[0].get();
            if (this.child[1]) yield * this.child[1].get();
        }
    }

    all() {
        let output = {};
        for (let [bits, box] of this.get()) {
            output[bitsToHash(bits)] = box;
        }
        return output;
    }

    hashes() {
        return Object.keys(this.all());
    }

    boxes() {
        return Object.values(this.all());
    }
}


console.log(new GeohashNode().cover(new Point([0,0]), 10).all());
console.log(new GeohashNode().cover(new Point([0,1]), 10).all());
console.log(new GeohashNode().cover(new Point([1,1]), 10).all());
console.log(new GeohashNode().cover(new Point([-1,1]), 10).all());
console.log(new GeohashNode().cover(new Point([-1,-1]), 10).all());
console.log(new GeohashNode().cover(new Point([1,-1]), 10).all());
console.log(new GeohashNode().cover(new Point([1,1.9]), 30).all());

var ghn = new GeohashNode().cover(new Box([0,0,50,50]), 10);
console.log(ghn.all());
console.log(ghn.hashes());
console.log(ghn.boxes());

console.log(new GeohashNode().fromBits(hashToBits("s01men")).all());
