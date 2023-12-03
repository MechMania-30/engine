import { Plane, PlaneType, Position } from "./plane"
import {
    HelloWorldRequest,
    PlaneSelectRequest,
    PlaneSelectResponse,
    Player,
} from "./player"
import * as CONFIG from "./config"

export default class Game {
    private turn: number = 0
    private planes: Plane[] = []

    constructor(
        private player0: Player,
        private player1: Player
    ) {}

    async createPlanes(player: Player, selected: PlaneSelectResponse) {
        const toPlace: PlaneType[] = []
        for (const [type, count] of selected.entries()) {
            for (let i = 0; i < count; i++) {
                toPlace.push(type)
            }
        }

        const { position: spawnPosition, angle: spawnAngle } =
            CONFIG.SPAWNS[player.team]

        for (let i = 0; i < toPlace.length; i++) {
            const type = toPlace[i]
            const offset = (i - toPlace.length / 2) * CONFIG.PLANE_SPAWN_SPREAD
            const pos = new Position(spawnPosition.x + offset, spawnPosition.y)
            this.planes.push(new Plane(player.team, type, pos, spawnAngle))
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
            console.log("Selected planes: ", this.planes)
        }

        this.turn += 1
    }

    async finish() {
        await this.player0.finish()
        await this.player1.finish()
    }
}
