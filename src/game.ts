import { Plane, PlaneId, PlaneType, Position } from "./plane"
import { PlaneSelectResponse, Player, SteerInputRequest } from "./player"
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
            const id: PlaneId = this.planes.length.toString()
            const type = toPlace[i]
            const offset = (i - toPlace.length / 2) * CONFIG.PLANE_SPAWN_SPREAD
            const pos = new Position(spawnPosition.x + offset, spawnPosition.y)
            this.planes.push(new Plane(id, player.team, type, pos, spawnAngle))
        }
    }

    async runTurn() {
        if (this.turn == 0) {
            await this.player0.sendHelloWorld({
                team: CONFIG.TEAMS.ZERO,
            })
            await this.player1.sendHelloWorld({
                team: CONFIG.TEAMS.ONE,
            })

            const player0PlanesSelectedResponse =
                await this.player0.getPlanesSelected()
            this.createPlanes(this.player0, player0PlanesSelectedResponse)
            const player1PlanesSelectedResponse =
                await this.player1.getPlanesSelected()
            this.createPlanes(this.player1, player1PlanesSelectedResponse)
            console.log("Selected planes: ", this.planes)

            this.turn = 1
            return // No action for turn 0
        }

        const steerInputRequest: SteerInputRequest = this.planes
        const player0SteerInputResponse =
            await this.player0.getSteerInput(steerInputRequest)
        const player1SteerInputResponse =
            await this.player1.getSteerInput(steerInputRequest)

        for (const plane of this.planes) {
            const stats = CONFIG.PLANE_STATS[plane.type]

            const thisTeamSteerInput =
                plane.team == CONFIG.TEAMS.ZERO
                    ? player0SteerInputResponse
                    : player1SteerInputResponse
            let steer = thisTeamSteerInput.get(plane.id) ?? 0
            steer = Math.max(Math.min(steer, 1), -1)

            plane.angle = (plane.angle + stats.turnSpeed * steer) % 360
            while (plane.angle < 0) {
                plane.angle += 360
            }

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
