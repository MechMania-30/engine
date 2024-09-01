import { Plane, PlaneId } from "./plane/plane"
import { Position } from "./plane/position"
import { PlaneType } from "./plane/data"
import { PlaneSelectResponse, Player, SteerInputRequest } from "./player"
import * as CONFIG from "./config"
import { rad, deg, degDiff } from "./util/angle"
import { Log, Stats } from "./log"
import deepCopy from "./util/deepCopy"

export default class Game {
    public turn: number = 0
    private planes: Map<string, Plane> = new Map()
    public log: Log = new Log()

    constructor(private players: Player[]) {}

    private alivePlanes() {
        return new Map(
            [...this.planes.entries()].filter(
                ([_id, plane]) => plane.health > 0
            )
        )
    }

    private inBounds(position: Position) {
        return (
            Math.abs(position.x) < CONFIG.MAP_SIZE / 2 &&
            Math.abs(position.y) < CONFIG.MAP_SIZE / 2
        )
    }

    private checkPlaneAttackIntersectionResult(
        plane: Plane,
        attacking: Plane,
        alreadyAttackedPairs: Set<string>
    ): number | undefined {
        const stats = CONFIG.PLANE_STATS[plane.type]
        if (plane.health == 0) {
            return
        }

        // Shouldn't attack dead planes
        if (attacking.health == 0) {
            return
        }

        // Shouldn't attack our team
        if (plane.team == attacking.team) {
            return
        }
        const diffVector = new Position(
            attacking.position.x - plane.position.x,
            attacking.position.y - plane.position.y
        )

        const distance = diffVector.magnitude()

        // Collision check
        if (distance <= CONFIG.COLLISION_RADIUS) {
            console.log(`${plane.id} collides with ${attacking.id}`)
            return attacking.health
        }

        // Cone checks: radius
        if (distance > stats.attackRange) {
            return
        }

        // Cone checks: angle
        const diffVectorAngle = deg(Math.atan2(diffVector.y, diffVector.x))

        const diffAngle = degDiff(plane.angle, diffVectorAngle)

        if (diffAngle > stats.attackSpreadAngle) {
            return
        }

        // Verify hasn't already been attacked by this plane this turn
        const key = `${plane.id} attacks ${attacking.id}`
        if (alreadyAttackedPairs.has(key)) {
            return
        }
        alreadyAttackedPairs.add(key)

        console.log(key)

        return 1
    }

    private computeStats(): Stats {
        const remainingPlaneScores = this.players.map((player) =>
            [...this.alivePlanes().values()]
                .filter((plane) => plane.team === player.team)
                .reduce(
                    (prev, curr) => prev + CONFIG.PLANE_STATS[curr.type].cost,
                    0
                )
        )

        const totalSpends = this.players.map((player) =>
            [...this.planes.values()]
                .filter((plane) => plane.team === player.team)
                .reduce(
                    (prev, curr) => prev + CONFIG.PLANE_STATS[curr.type].cost,
                    0
                )
        )
        const dealtDamages = this.players.map((player) => player.damage)

        return {
            remainingPlaneScores,
            totalSpends,
            dealtDamages,
        }
    }

    private parseSelectedPlanes(
        team: number,
        selected: PlaneSelectResponse
    ): PlaneType[] {
        const requested: PlaneType[] = []
        let totalSpent = 0
        for (const [selection, count] of selected) {
            const stats = CONFIG.PLANE_STATS[selection]
            if (!stats) {
                console.error(
                    `[Validation] Player ${team} requested invalid plane type ${selection}`
                )
                continue
            }
            for (let i = 0; i < count; i++) {
                const newTotalSpent = totalSpent + stats.cost
                if (newTotalSpent > CONFIG.MAX_SPEND) {
                    console.error(
                        `[Validation] Player ${team} attempted to spend over max spend ${CONFIG.MAX_SPEND} (${newTotalSpent}), locked plane choice to before over max spend`
                    )
                    return requested
                }
                requested.push(PlaneType[selection])
                totalSpent = newTotalSpent
            }
        }
        return requested
    }

    private createPlanes(team: number, toPlace: PlaneType[]) {
        const { position: spawnPosition, angle: spawnAngle } =
            CONFIG.SPAWNS[team]

        for (let i = 0; i < toPlace.length; i++) {
            const id: PlaneId = this.planes.size.toString()
            const type = toPlace[i]
            const offset = (i - toPlace.length / 2) * CONFIG.PLANE_SPAWN_SPREAD
            const pos = new Position(spawnPosition.x + offset, spawnPosition.y)
            this.planes.set(id, new Plane(id, team, type, pos, spawnAngle))
        }
    }

    // Requests player plane choices, validates them, then sets up new planes
    private async initPlayerPlanes() {
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
            const selectedPlanes = this.parseSelectedPlanes(team, selected)
            if (selectedPlanes.length === 0) {
                console.error(
                    `[Validation] Player ${team} failed to provide a plane selection and lost`
                )
            }
            this.createPlanes(team, selectedPlanes)
        })
        console.log("Selected planes: ", this.planes)
    }

    // Requests player steering per plane, validates them, and applies new steering angle
    private async steerPlayerPlanes() {
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
            const rawSteer = thisTeamSteerInput.get(plane.id) ?? 0
            const steer = Math.max(Math.min(rawSteer, 1), -1)

            if (rawSteer !== steer) {
                console.error(
                    `[Validation] Player ${plane.team} sent invalid steer ${rawSteer} for plane ${plane.id}, corrected to ${steer}`
                )
            }

            plane.angle = (plane.angle + stats.turnSpeed * steer) % 360
            while (plane.angle < 0) {
                plane.angle += 360
            }
        }
    }

    // Runs a turn, returns true if the game should continue, false if it has ended
    async runTurn(): Promise<boolean> {
        if (this.turn == 0) {
            await this.initPlayerPlanes()

            this.turn = 1
            return true // No action for turn 0
        }

        // Steer planes
        await this.steerPlayerPlanes()

        // Run a set of interpolated steps for each turn
        const alreadyAttackedPairs: Set<string> = new Set()
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
                    console.log(`${plane.id} collides with border`)
                    plane.health = 0
                }
            }

            // Then, check for any intersections for attacks
            const damaged: { plane: Plane; by: number; damage: number }[] = []
            for (const plane of this.planes.values()) {
                for (const attacking of this.planes.values()) {
                    const result = this.checkPlaneAttackIntersectionResult(
                        plane,
                        attacking,
                        alreadyAttackedPairs
                    )
                    if (result !== undefined) {
                        damaged.push({
                            plane: attacking,
                            by: plane.team,
                            damage: result,
                        })
                    }
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
        const stats = this.computeStats()

        const deadTeams = stats.remainingPlaneScores.filter(
            (score) => score === 0
        ).length
        const gameOver =
            this.turn >= CONFIG.TURNS || deadTeams >= this.players.length - 1

        if (gameOver) {
            this.finish(stats)
            return false
        }

        // Prepare for next turn
        this.turn += 1

        return true
    }

    private async finish(stats: Stats) {
        const { remainingPlaneScores, totalSpends, dealtDamages } = stats

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
        this.log.finish(wins, stats)

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
