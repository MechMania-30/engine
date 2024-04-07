import { Plane, PlaneId } from "./plane/plane"
import { Position } from "./plane/position"
import { PlaneType } from "./plane/data"
import { PlaneSelectResponse, Player, SteerInputRequest } from "./player"
import * as CONFIG from "./config"
import rad, { deg } from "./util/rad"
import { Log } from "./log"
import deepCopy from "./util/deepCopy"

export default class Game {
    private turn: number = 0
    private planes: Plane[] = []
    public log: Log = new Log()

    constructor(private players: Player[]) {}

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
            await Promise.all(
                this.players.map((player) => player.sendHelloWorld())
            )

            const planesSelectedResponses = await Promise.all(
                this.players.map((player) => player.getPlanesSelected())
            )

            planesSelectedResponses.forEach((selected, team) => {
                this.createPlanes(this.players[team], selected)
            })
            console.log("Selected planes: ", this.planes)

            this.turn = 1
            return // No action for turn 0
        }

        const steerInputRequest: SteerInputRequest = this.planes
        const steerInputResponses = await Promise.all(
            this.players.map((player) =>
                player.getSteerInput(steerInputRequest)
            )
        )

        for (const plane of this.planes) {
            if (plane.health == 0) {
                break
            }
            const stats = CONFIG.PLANE_STATS[plane.type]

            const thisTeamSteerInput = steerInputResponses[plane.team]
            let steer = thisTeamSteerInput.get(plane.id) ?? 0
            steer = Math.max(Math.min(steer, 1), -1)

            plane.angle = (plane.angle + stats.turnSpeed * steer) % 360
            while (plane.angle < 0) {
                plane.angle += 360
            }
        }

        const alreadyAttackedPairs: Set<string> = new Set()

        for (let i = 0; i < CONFIG.ATTACK_STEPS; i++) {
            for (const plane of this.planes) {
                if (plane.health == 0) {
                    break
                }
                const stats = CONFIG.PLANE_STATS[plane.type]

                for (const attacking of this.planes) {
                    if (attacking.health == 0) {
                        break
                    }
                    if (plane.team == attacking.team) {
                        break
                    }
                    const diffVector = new Position(
                        attacking.position.x - plane.position.x,
                        attacking.position.y - plane.position.y
                    )
                    const distance = diffVector.magnitude()

                    if (distance > stats.attackRange) {
                        break
                    }

                    const diffVectorAngle = deg(
                        Math.atan2(diffVector.y, diffVector.x)
                    )

                    const diffAngle = plane.angle - diffVectorAngle

                    if (Math.abs(diffAngle) > stats.attackSpreadAngle) {
                        break
                    }

                    const key = `${plane.id} attacks ${attacking.id}`
                    if (alreadyAttackedPairs.has(key)) {
                        break
                    }
                    alreadyAttackedPairs.add(key)

                    attacking.health -= 1

                    console.log(key)
                }

                const SCALE_FACTOR = stats.speed * (1 / CONFIG.ATTACK_STEPS)
                const dx = Math.cos(rad(plane.angle)) * SCALE_FACTOR
                const dy = Math.sin(rad(plane.angle)) * SCALE_FACTOR
                plane.position.add(new Position(dx, dy))
            }
        }

        this.log.addTurn({
            planes: deepCopy(this.planes),
        })
        this.turn += 1
    }

    async finish() {
        await Promise.all(this.players.map((player) => player.finish()))
    }
}
