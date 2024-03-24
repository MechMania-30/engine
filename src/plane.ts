export enum PlaneType {
    BASIC = "BASIC",
}

export class Position {
    constructor(
        public x: number,
        public y: number
    ) {}

    add(other: Position) {
        this.x += other.x
        this.y += other.y
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

export type PlaneId = string

export class Plane {
    constructor(
        readonly id: PlaneId,
        readonly team: number,
        readonly type: PlaneType,
        public position: Position,
        public angle: number // Angle that faces [0, 360) so 0 = East, 90 = North, etc.
    ) {}
}

export class PlaneStats {
    constructor(
        readonly speed: number,
        readonly turnSpeed: number,
        readonly attackSpreadAngle: number,
        readonly attackRange: number
    ) {}
}
