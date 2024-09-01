import { Plane, PlaneId } from "./plane/plane"
import { Position } from "./plane/position"
import { PlaneType } from "./plane/data"
import { PlaneSelectResponse, Player, SteerInputRequest } from "./player"
import * as CONFIG from "./config"
import { rad, deg, degDiff } from "./util/angle"
import { Log } from "./log"
import deepCopy from "./util/deepCopy"

export default class Game {
    public turn: number = 0
    private planes: Map<string, Plane> = new Map()
    public log: Log = new Log()

    constructor(private players: Player[]) {}

    alivePlanes() {
        return new Map(
            [...this.planes.entries()].filter(
                ([_id, plane]) => plane.health > 0
            )
        )
    }

    inBounds(position: Position) {
        return (
            Math.abs(position.x) < CONFIG.MAP_SIZE / 2 &&
            Math.abs(position.y) < CONFIG.MAP_SIZE / 2
        )
    }

    createPlanes(player: Player, selected: PlaneSelectResponse) {
        const toPlace: PlaneType[] = []
        for (const [type, count] of selected.entries()) {
            for (let i = 0; i < count; i++) {
                toPlace.push(type)
            }
        }

        const { position: spawnPosition, angle: spawnAngle } =
            CONFIG.SPAWNS[player.team]

        for (let i = 0; i < toPlace.length; i++) {
            const id: PlaneId = this.planes.size.toString()
            const type = toPlace[i]
            const offset = (i - toPlace.length / 2) * CONFIG.PLANE_SPAWN_SPREAD
            const pos = new Position(spawnPosition.x + offset, spawnPosition.y)
            this.planes.set(
                id,
                new Plane(id, player.team, type, pos, spawnAngle)
            )
        }
    }

    // Runs a turn, returns true if the game should continue, false if it has ended
    async runTurn(): Promise<boolean> {
        if (this.turn == 0) {
            await Promise.all(
                this.players.map((player) =>
                    player.sendHelloWorld({
                        team: player.team,
                        stats: CONFIG.PLANE_STATS,
                    })
                )
            )

            const planesSelectedResponses = await Promise.all(
                this.players.map((player) => player.getPlanesSelected())
            )

            planesSelectedResponses.forEach((selected, team) => {
                this.createPlanes(this.players[team], selected)
            })
            console.log("Selected planes: ", this.planes)

            this.turn = 1
            return true // No action for turn 0
        }

        const steerInputRequest: SteerInputRequest = Object.fromEntries(
            this.alivePlanes().entries()
        )
        const steerInputResponses = await Promise.all(
            this.players.map((player) =>
                player.getSteerInput(steerInputRequest)
            )
        )

        for (const plane of this.planes.values()) {
            if (plane.health == 0) {
                continue
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

        // Run a set of interpolated steps for each turn
        for (let i = 0; i < CONFIG.ATTACK_STEPS; i++) {
            // First, move planes for this step
            for (const plane of this.planes.values()) {
                if (plane.health == 0) {
                    continue
                }
                const stats = CONFIG.PLANE_STATS[plane.type]

                const SCALE_FACTOR = stats.speed * (1 / CONFIG.ATTACK_STEPS)
                const dx = Math.cos(rad(plane.angle)) * SCALE_FACTOR
                const dy = Math.sin(rad(plane.angle)) * SCALE_FACTOR
                plane.position.add(new Position(dx, dy))

                // Check in bounds
                if (!this.inBounds(plane.position)) {
                    plane.health = 0
                }
            }

            // Then, check for any intersections for attacks
            const damaged: { plane: Plane; by: number; damage: number }[] = []
            for (const plane of this.planes.values()) {
                if (plane.health == 0) {
                    continue
                }
                const stats = CONFIG.PLANE_STATS[plane.type]

                for (const attacking of this.planes.values()) {
                    if (plane.health == 0) {
                        continue
                    }

                    // Shouldn't attack dead planes
                    if (attacking.health == 0) {
                        continue
                    }

                    // Shouldn't attack our team
                    if (plane.team == attacking.team) {
                        continue
                    }
                    const diffVector = new Position(
                        attacking.position.x - plane.position.x,
                        attacking.position.y - plane.position.y
                    )

                    const distance = diffVector.magnitude()

                    // Collision check
                    if (distance <= CONFIG.COLLISION_RADIUS) {
                        damaged.push({
                            plane: attacking,
                            by: plane.team,
                            damage: attacking.health,
                        })
                        continue
                    }

                    // Cone checks: radius
                    if (distance > stats.attackRange) {
                        continue
                    }

                    // Cone checks: angle
                    const diffVectorAngle = deg(
                        Math.atan2(diffVector.y, diffVector.x)
                    )

                    const diffAngle = degDiff(plane.angle, diffVectorAngle)

                    if (diffAngle > stats.attackSpreadAngle) {
                        continue
                    }

                    // Verify hasn't already been attacked by this plane this turn
                    const key = `${plane.id} attacks ${attacking.id}`
                    if (alreadyAttackedPairs.has(key)) {
                        continue
                    }
                    alreadyAttackedPairs.add(key)

                    damaged.push({
                        plane: attacking,
                        by: plane.team,
                        damage: 1,
                    })

                    console.log(key)
                }
            }

            // Apply damage after, so we can have plane <-> plane attacks where both die
            for (const { plane, by, damage } of damaged) {
                this.players[by].damage += damage

                if (plane.health == 0) continue
                plane.health = Math.max(0, plane.health - damage)
            }
        }

        // Log turn
        this.log.addTurn({
            planes: deepCopy(Object.fromEntries(this.planes)),
        })

        // Check for game condition
        const remainingPlaneScores = this.players.map((player) =>
            [...this.planes.values()]
                .filter(
                    (plane) => plane.team === player.team && plane.health > 0
                )
                .reduce(
                    (prev, curr) => prev + CONFIG.PLANE_STATS[curr.type].cost,
                    0
                )
        )

        const deadTeams = remainingPlaneScores.filter(
            (score) => score === 0
        ).length
        const gameOver =
            this.turn >= CONFIG.TURNS || deadTeams >= this.players.length - 1

        if (gameOver) {
            this.finish(remainingPlaneScores)
            return false
        }

        // Prepare for next turn
        this.turn += 1

        return true
    }

    private async finish(remainingPlaneScores: number[]) {
        // Compute stats
        const totalSpends = this.players.map((player) =>
            [...this.planes.values()]
                .filter((plane) => plane.team === player.team)
                .reduce(
                    (prev, curr) => prev + CONFIG.PLANE_STATS[curr.type].cost,
                    0
                )
        )
        const dealtDamages = this.players.map((player) => player.damage)

        // Create tiebreakers (highest is best)
        const tiebreakers = [
            remainingPlaneScores,
            totalSpends.map((value) => -value), // negative because we want lowest
            dealtDamages,
        ]

        // Go through each tiebreaker, narrowing players in the running
        let inTheRunning = [...this.players]
        for (const tiebreaker of tiebreakers) {
            const best = Math.max(...tiebreaker)
            inTheRunning = inTheRunning.filter(
                (player) => tiebreaker[player.team] === best
            )

            if (inTheRunning.length === 1) {
                break
            }
        }

        // Split win among tied players
        const wins = this.players.map((player) =>
            inTheRunning.includes(player) ? 1 / inTheRunning.length : 0
        )

        // Finalize log
        this.log.finish(wins, {
            totalSpends,
            dealtDamages,
            remainingPlaneScores,
        })

        // Finish connections
        await Promise.all(
            this.players.map((player) =>
                player.finish(
                    `You ${
                        wins[player.team] === 0
                            ? "lost"
                            : wins[player.team] === 1
                            ? "won"
                            : "tied"
                    }!\nStats:\n  - ${
                        remainingPlaneScores[player.team]
                    } remaining plane score\n  - Spent ${
                        totalSpends[player.team]
                    } points\n  - Dealt ${dealtDamages[player.team]} damage`
                )
            )
        )
    }
}
