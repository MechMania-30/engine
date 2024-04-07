import { PLANE_STATS } from "../config"
import { PlaneType } from "./data"
import { Position } from "./position"

export type PlaneId = string

export class Plane {
    public health: number
    constructor(
        readonly id: PlaneId,
        readonly team: number,
        readonly type: PlaneType,
        public position: Position,
        public angle: number // Angle that faces [0, 360) so 0 = East, 90 = North, etc.
    ) {
        this.health = PLANE_STATS[type].health
    }
}
