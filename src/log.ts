import { PLANE_STATS } from "./config"
import { DamageEvent } from "./game"
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
    private damageEvents: DamageEvent[] = []
    private turns: LogTurn[] = []
    private output: string = ""

    constructor() {}

    addDamageEvent(event: DamageEvent) {
        this.damageEvents.push(event)
    }

    addTurn(turn: LogTurn) {
        this.turns.push(turn)
    }

    finish(wins: number[], stats: Stats) {
        this.output = JSON.stringify(
            {
                wins,
                stats,
                planeStats: this.planeStats,
                damageEvents: this.damageEvents,
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
