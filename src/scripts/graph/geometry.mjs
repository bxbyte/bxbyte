export class Vector {
    x;
    y;
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }
    randomize(bbox) {
        this.x = (bbox.width - bbox.x) * Math.random() + bbox.x;
        this.y = (bbox.height - bbox.y) * Math.random() + bbox.y;
    }
    copy() {
        return new Vector(this.x, this.y);
    }
    from({ x, y }) {
        this.x = x;
        this.y = y;
    }
    add(v) {
        this.x += v.x;
        this.y += v.y;
    }
    sub(v) {
        this.x += v.x;
        this.y += v.y;
    }
    mult(v) {
        this.x *= v;
        this.y *= v;
    }
    div(v) {
        this.x /= v;
        this.y /= v;
    }
    dist(v) {
        return Math.hypot(v.x - this.x, v.y - this.y);
    }
    static dist(v1, v2) {
        return new Vector(v2.x - v1.x, v2.y - v1.y);
    }
    length() {
        return Math.hypot(this.x, this.y);
    }
    reset() {
        this.x = 0;
        this.y = 0;
    }
    toString() {
        return `${this.x},${this.y}`;
    }
}
export class Particule extends Vector {
    v;
    constructor(x = undefined, y = undefined) {
        super(x, y);
        this.v = new Vector();
    }
    upd() {
        this.add(this.v);
        this.v.reset();
    }
    addForce(force) {
        this.v.add(force);
    }
    cut(bbox) {
        if (bbox.x > this.x) {
            this.v.x *= -1;
            this.x = bbox.x;
        }
        if (bbox.width - 1 < this.x) {
            this.v.x *= -1;
            this.x = bbox.width - 1;
        }
        if (bbox.y > this.y) {
            this.v.y *= -1;
            this.y = bbox.y;
        }
        if (bbox.height - 1 < this.y) {
            this.v.y *= -1;
            this.y = bbox.height - 1;
        }
    }
}
