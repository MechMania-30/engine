export class Vector {
    constructor(
        public x: number,
        public y: number
    ) {}

    add(other: Vector) {
        this.x += other.x
        this.y += other.y
    }

    magnitude(): number {
        return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2))
    }
}

export enum Direction {
    EAST = 0,
    NORTHEAST = 45,
    NORTH = 90,
    NORTHWEST = 135,
    WEST = 180,
    SOUTHWEST = 225,
    SOUTH = 270,
    SOUTHEAST = 315,
}
