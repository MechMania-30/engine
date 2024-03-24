import { PLANE_STATS } from "./config"
import { Plane } from "./plane"

export interface LogTurn {
    planes: Plane[]
}

export class Log {
    private planeStats = PLANE_STATS
    private turns: LogTurn[] = []
    constructor() {}

    addTurn(turn: LogTurn) {
        this.turns.push(turn)
    }

    toString(): string {
        return JSON.stringify(this, undefined, "\t")
    }
}
