import { HelloWorldRequest, Player } from "./player"

export default class Game {
    private turn: number = 0

    constructor(
        private player0: Player,
        private player1: Player
    ) {}

    async runTurn() {
        const request: HelloWorldRequest = {
            message: "Hello players!",
        }
        const player0HelloWorldResponse = await this.player0.getHello(request)
        const player1HelloWorldResponse = await this.player1.getHello(request)

        console.log(`Player 0 good: ${player0HelloWorldResponse.good}`)
        console.log(`Player 1 good: ${player1HelloWorldResponse.good}`)

        this.turn += 1
    }

    async finish() {
        await this.player0.finish()
        await this.player1.finish()
    }
}
