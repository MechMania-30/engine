import { PLANE_STATS } from "./config"
import { DamageEvent } from "./game"
import { Logger } from "./logger"
import { Plane } from "./plane/plane"

export interface LogTurn {
    planes: Record<string, Plane>
}

export interface ValidationEvent {
    turn: number
    team: number
    message: string
}

export interface Stats {
    totalSpends: number[]
    remainingPlaneScores: number[]
    dealtDamages: number[]
}

export class Log {
    private planeStats = PLANE_STATS
    private damageEvents: DamageEvent[] = []
    private validationEvents: ValidationEvent[] = []
    private turns: LogTurn[] = []
    private output: string = ""

    constructor() {}

    addDamageEvent(event: DamageEvent) {
        Logger.log(
            `[Turn ${event.turn}] [Damage event] ${event.type}: plane ${
                event.attacked
            } damaged ${event.by ? "by " + event.by + " " : ""}for ${
                event.damage
            } damage, ${event.dead ? "now dead" : "still alive"}`
        )
        this.damageEvents.push(event)
    }

    logValidationError(team: number, message: string) {
        Logger.error(`[Validation Error] Player ${team} ${message}`)
        this.validationEvents.push({
            turn: Logger.turn,
            team,
            message,
        })
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
                validationEvents: this.validationEvents,
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
