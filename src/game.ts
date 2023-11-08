import { Plane } from "./plane"
import {
    HelloWorldRequest,
    PlaneSelectRequest,
    PlaneSelectResponse,
    Player,
} from "./player"

export default class Game {
    private turn: number = 0
    private planes: Plane[] = []

    constructor(
        private player0: Player,
        private player1: Player
    ) {}

    async createPlanes(player: Player, selected: PlaneSelectResponse) {
        for (const selection of selected) {
            for (let i = 0; i < selection.count; i++) {
                this.planes.push(new Plane(player.teamName, selection.type))
            }
        }
    }

    async runTurn() {
        const request: HelloWorldRequest = {
            message: "Hello players!",
        }

        const player0HelloWorldResponse = await this.player0.getHello(request)
        const player1HelloWorldResponse = await this.player1.getHello(request)

        console.log(`Player 0 good: ${player0HelloWorldResponse.good}`)
        console.log(`Player 1 good: ${player1HelloWorldResponse.good}`)

        if (this.turn == 0) {
            const planeRequest: PlaneSelectRequest = {}
            const player0PlanesSelectedResponse =
                await this.player0.getPlanesSelected(planeRequest)
            this.createPlanes(this.player0, player0PlanesSelectedResponse)
            const player1PlanesSelectedResponse =
                await this.player1.getPlanesSelected(planeRequest)
            this.createPlanes(this.player1, player1PlanesSelectedResponse)
            console.log(`Selected planes: ${JSON.stringify(this.planes)}`)
        }

        this.turn += 1
    }

    async finish() {
        await this.player0.finish()
        await this.player1.finish()
    }
}
