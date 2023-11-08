import { Plane, PlaneType } from "./plane"
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

    async createAndStorePlanes(
        player0Response: PlaneSelectResponse,
        player1Response: PlaneSelectResponse
    ) {
        // Create and store planes based on the responses
        const planesForPlayer0: Plane[] = []
        const planesForPlayer1: Plane[] = []

        // Helper function to create planes based on a type and count
        function _createPlanes(
            playerPlanes: Plane[],
            type: PlaneType,
            count: number
        ) {
            for (let i = 0; i < count; i++) {
                playerPlanes.push(new Plane("player", type))
            }
        }

        // Create planes for player 0 (the response is the array of json objects)
        for (const selection of player0Response) {
            _createPlanes(planesForPlayer0, selection.type, selection.count)
        }

        // Create planes for player 1
        for (const selection of player1Response) {
            _createPlanes(planesForPlayer1, selection.type, selection.count)
        }

        // Concatenate the planes for both players
        this.planes = planesForPlayer0.concat(planesForPlayer1)

        // Log the stored planes
        console.log("Planes created and stored:", this.planes)
    }

    async runTurn() {
        const request: HelloWorldRequest = {
            message: "Hello players!",
        }

        const planeRequest: PlaneSelectRequest = {}
        const player0HelloWorldResponse = await this.player0.getHello(request)
        const player1HelloWorldResponse = await this.player1.getHello(request)

        console.log(`Player 0 good: ${player0HelloWorldResponse.good}`)
        console.log(`Player 1 good: ${player1HelloWorldResponse.good}`)

        if (this.turn == 0) {
            const player0PlanesSelectedResponse =
                await this.player0.getPlanesSelected(planeRequest)
            const player1PlanesSelectedResponse =
                await this.player1.getPlanesSelected(planeRequest)

            console.log(
                `Player 0 selected planes: ${player0PlanesSelectedResponse}`
            )
            console.log(
                `Player 1 selected planes: ${player1PlanesSelectedResponse}`
            )
        }

        this.turn += 1
    }

    async finish() {
        await this.player0.finish()
        await this.player1.finish()
    }
}
