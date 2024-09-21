import { PLANE_STATS } from "../config"
import { PlaneStats, PlaneType } from "./data"
import { Vector } from "./vector"

export type PlaneId = string

export class Plane {
    public health: number
    public stats: PlaneStats
    constructor(
        readonly id: PlaneId,
        readonly team: number,
        readonly type: PlaneType,
        public position: Vector,
        public angle: number // Angle that faces [0, 360) so 0 = East, 90 = North, etc.
    ) {
        this.stats = PLANE_STATS[type]
        this.health = this.stats.maxHealth
    }
}
