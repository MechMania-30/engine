import { Plane, PlaneType, Position } from "./plane"
import { PlaneSelectRequest, PlaneSelectResponse, Player } from "./player"
import * as CONFIG from "./config"
import rad from "./util/rad"
import { Log } from "./log"
import deepCopy from "./util/deepCopy"

export default class Game {
    private turn: number = 0
    private planes: Plane[] = []
    public log: Log = new Log()

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
        if (this.turn == 0) {
            const planeRequest: PlaneSelectRequest = {}
            const player0PlanesSelectedResponse =
                await this.player0.getPlanesSelected(planeRequest)
            this.createPlanes(this.player0, player0PlanesSelectedResponse)
            const player1PlanesSelectedResponse =
                await this.player1.getPlanesSelected(planeRequest)
            this.createPlanes(this.player1, player1PlanesSelectedResponse)
            console.log("Selected planes: ", this.planes)

            this.turn = 1
            return // No action for turn 0
        }

        // TODO: Steering goes here

        for (const plane of this.planes) {
            const stats = CONFIG.PLANE_STATS[plane.type]
            const dx = Math.cos(rad(plane.angle)) * stats.speed
            const dy = -Math.sin(rad(plane.angle)) * stats.speed
            plane.position.add(new Position(dx, dy))
        }

        this.log.addTurn({
            planes: deepCopy(this.planes),
        })
        this.turn += 1
    }

    async finish() {
        await this.player0.finish()
        await this.player1.finish()
    }
}
