import { PLANE_STATS } from "./config"
import { Plane } from "./plane/plane"

export interface LogTurn {
    planes: Record<string, Plane>
}

export interface Stats {
    totalSpends: number[]
    remainingPlaneScores: number[]
    dealtDamages: number[]
}

export class Log {
    private planeStats = PLANE_STATS
    private turns: LogTurn[] = []
    private output: string = ""

    constructor() {}

    addTurn(turn: LogTurn) {
        this.turns.push(turn)
    }

    finish(wins: number[], stats: Stats) {
        this.output = JSON.stringify(
            {
                wins,
                stats,
                planeStats: this.planeStats,
                turns: this.turns,
            },
            undefined,
            "\t"
        )
    }

    toString(): string {
        return this.output
    }
}
