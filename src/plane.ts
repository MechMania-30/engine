export enum PlaneType {
    BASIC = "BASIC",
}

export class Position {
    constructor(
        readonly x: number,
        readonly y: number
    ) {}
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

export class Plane {
    constructor(
        readonly team: string,
        readonly type: PlaneType,
        readonly position: Position,
        readonly angle: number // Angle that faces [0, 360) so 0 = East, 90 = North, etc.
    ) {}
}
