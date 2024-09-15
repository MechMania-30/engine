import { DEBUG } from "./config"

export class Logger {
    public static turn = 0

    static setTurn(turn: number) {
        this.turn = turn
        if (DEBUG) {
            console.log(`Start turn ${this.turn}`)
        }
    }

    static log(message: string) {
        console.log(`${message}`)
    }

    static error(message: string) {
        console.error(`[Turn ${this.turn}] ${message}`)
    }
}
