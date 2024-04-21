import { PLANE_STATS } from "./config"
import { Plane } from "./plane/plane"

export interface LogTurn {
    planes: Record<string, Plane>
}

export class Log {
    private planeStats = PLANE_STATS
    private turns: LogTurn[] = []
    private wins = [0, 0]
    constructor() {}

    addTurn(turn: LogTurn) {
        this.turns.push(turn)
    }

    addWin(team: number) {
        this.wins[team] += 1
    }

    toString(): string {
        return JSON.stringify(this, undefined, "\t")
    }
}
