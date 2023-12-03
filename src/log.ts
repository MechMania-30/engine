import { Plane } from "./plane"

export interface LogTurn {
    planes: Plane[]
}

export class Log {
    private turns: LogTurn[] = []
    constructor() {}

    addTurn(turn: LogTurn) {
        this.turns.push(turn)
    }

    toString(): string {
        return JSON.stringify(this, undefined, "\t")
    }
}
