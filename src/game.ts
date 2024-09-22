import { Plane, PlaneId } from "./plane/plane"
import { Vector } from "./plane/vector"
import { PlaneType } from "./plane/data"
import { PlaneSelectResponse, Player, SteerInputRequest } from "./player"
import * as CONFIG from "./config"
import { deg, degDiff, normalizeAngle, rad } from "./util/angle"
import { Log, Stats } from "./log"
import deepCopy from "./util/deepCopy"
import { Logger } from "./logger"

export enum DamageEventType {
    PLANE_ATTACK = "PLANE_ATTACK",
    BORDER = "BORDER",
    COLLISION = "COLLISION",
}

export interface DamageEvent {
    turn: number
    attacked: string
    by?: string
    damage: number
    type: DamageEventType
    dead: boolean
}

export default class Game {
    public turn: number = 0
    private planes: Map<string, Plane> = new Map()

    constructor(
        private players: Player[],
        private log: Log
    ) {}

    private alivePlanes() {
        return new Map(
            [...this.planes.entries()].filter(
                ([_id, plane]) => plane.health > 0
            )
        )
    }

    private inBounds(position: Vector) {
        return (
            Math.abs(position.x) < CONFIG.MAP_SIZE / 2 &&
            Math.abs(position.y) < CONFIG.MAP_SIZE / 2
        )
    }

    private checkPlaneAttackIntersectionResult(
        turn: number,
        plane: Plane,
        attacking: Plane,
        alreadyAttackedPairs: Set<string>
    ): DamageEvent | undefined {
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
        const diffVector = new Vector(
            attacking.position.x - plane.position.x,
            attacking.position.y - plane.position.y
        )

        const distance = diffVector.magnitude()

        // Collision check
        if (distance <= CONFIG.COLLISION_RADIUS) {
            return {
                attacked: attacking.id,
                damage: attacking.health,
                by: plane.id,
                dead: true,
                turn,
                type: DamageEventType.COLLISION,
            }
        }

        // Cone checks: radius
        if (distance > plane.stats.attackRange) {
            return
        }

        // Cone checks: angle
        const diffVectorAngle = deg(Math.atan2(diffVector.y, diffVector.x))

        const diffAngle = degDiff(plane.angle, diffVectorAngle)

        if (diffAngle > plane.stats.attackSpreadAngle) {
            return
        }

        // Verify hasn't already been attacked by this plane this turn
        const key = `${plane.id} attacks ${attacking.id}`
        if (alreadyAttackedPairs.has(key)) {
            return
        }
        alreadyAttackedPairs.add(key)

        return {
            attacked: attacking.id,
            by: plane.id,
            damage: plane.stats.attack,
            dead: false,
            type: DamageEventType.PLANE_ATTACK,
            turn,
        }
    }

    private computeStats(): Stats {
        const remainingPlaneScores = this.players.map((player) =>
            [...this.alivePlanes().values()]
                .filter((plane) => plane.team === player.team)
                .reduce(
                    (prev, curr) =>
                        prev +
                        curr.stats.cost * (curr.health / curr.stats.maxHealth),
                    0
                )
        )

        const totalSpends = this.players.map((player) =>
            [...this.planes.values()]
                .filter((plane) => plane.team === player.team)
                .reduce((prev, curr) => prev + curr.stats.cost, 0)
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
                this.log.logValidationError(
                    team,
                    `requested invalid plane type ${selection}`
                )
                continue
            }
            for (let i = 0; i < count; i++) {
                const newTotalSpent = totalSpent + stats.cost
                if (newTotalSpent > CONFIG.MAX_SPEND) {
                    this.log.logValidationError(
                        team,
                        `attempted to spend over max spend ${CONFIG.MAX_SPEND} (${newTotalSpent}), locked plane choice to before over max spend`
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
            const bounds = CONFIG.MAP_SIZE / 2 - 25
            let offset = (i - toPlace.length / 2) * CONFIG.PLANE_SPAWN_SPREAD
            while (offset >= bounds) {
                offset -= bounds
            }
            while (offset < -bounds) {
                offset += bounds
            }
            const pos = new Vector(spawnPosition.x + offset, spawnPosition.y)
            this.planes.set(id, new Plane(id, team, type, pos, spawnAngle))
        }
    }

    // Requests player plane choices, validates them, then sets up new planes
    private async initPlayerPlanes() {
        await Promise.all(
            this.players.map((player) =>
                player.sendHelloWorld({
                    team: player.team,
                })
            )
        )

        const planesSelectedResponses = await Promise.all(
            this.players.map((player) => player.getPlanesSelected())
        )

        planesSelectedResponses.forEach((selected, team) => {
            const selectedPlanes = this.parseSelectedPlanes(team, selected)
            if (selectedPlanes.length === 0) {
                this.log.logValidationError(
                    team,
                    "failed to provide a plane selection and lost"
                )
            }
            this.createPlanes(team, selectedPlanes)
        })
    }

    // Requests player steering per plane, validates them, and applies new steering angle
    private async steerPlayerPlanes(): Promise<Record<string, number>> {
        const angleDiffs: Record<string, number> = {}

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
            const thisTeamSteerInput = steerInputResponses[plane.team]
            const rawSteer = thisTeamSteerInput.get(plane.id) ?? 0
            const steer = Math.max(Math.min(rawSteer, 1), -1)

            if (rawSteer !== steer) {
                this.log.logValidationError(
                    plane.team,
                    `sent invalid steer ${rawSteer} for plane ${plane.id}, corrected to ${steer}`
                )
            }

            const thisDiff = plane.stats.turnSpeed * steer
            angleDiffs[plane.id] = thisDiff
        }

        return angleDiffs
    }

    // Given a plane, deltaSpeed, and deltaAngle, return the interpolated new position
    private interpolatePlanePosition(
        plane: Plane,
        deltaSpeed: number,
        deltaAngle: number
    ): Vector {
        const currAngle = rad(plane.angle)
        const deltaAngleRad = rad(deltaAngle)

        // Handle straight shot case
        if (deltaAngle === 0) {
            return new Vector(
                deltaSpeed * Math.cos(currAngle),
                deltaSpeed * Math.sin(currAngle)
            )
        }

        // (2pi * radius) * (rad(angleDiff) / 2pi) = deltaSpeed
        // radius * rad(angleDiff) = deltaSpeed
        // radius = deltaSpeed / rad(angleDiff)
        const radius = Math.abs(deltaSpeed / rad(deltaAngle))

        // We do +/- PI/2 because we need to go towards the circle, and currAngle is tangent to the circle
        // to get to the center of the circle
        const fromCenterAngle =
            currAngle + (deltaAngle > 0 ? -Math.PI / 2 : Math.PI / 2)

        // Then, we subtract into the center (-Math.cos(fromCenterAngle))
        // while adding from the center to our final position (+Math.cos(fromCenterAngle + deltaAngleRad))
        // Essentially, fromCenterAngle is the angle from the center of the turn circle to our current position,
        // so we rotate around the turn circle
        const deltaPosition = new Vector(
            radius *
                (Math.cos(fromCenterAngle + deltaAngleRad) -
                    Math.cos(fromCenterAngle)),
            radius *
                (Math.sin(fromCenterAngle + deltaAngleRad) -
                    Math.sin(fromCenterAngle))
        )

        return deltaPosition
    }

    private interpolatePlanes(angleDiffs: Record<string, number>) {
        const alreadyAttackedPairs: Set<string> = new Set()
        for (let i = 0; i < CONFIG.ATTACK_STEPS; i++) {
            const subTurn = this.turn + i / CONFIG.ATTACK_STEPS
            // First, move planes for this step
            for (const plane of this.planes.values()) {
                if (plane.health == 0) {
                    continue
                }
                const DELTA = 1 / CONFIG.ATTACK_STEPS
                const deltaAngle = DELTA * angleDiffs[plane.id]
                const deltaPosition = this.interpolatePlanePosition(
                    plane,
                    DELTA * plane.stats.speed,
                    deltaAngle
                )
                plane.angle = normalizeAngle(plane.angle + deltaAngle)
                plane.position.add(deltaPosition)

                // Check in bounds
                if (!this.inBounds(plane.position)) {
                    this.log.addDamageEvent({
                        turn: subTurn,
                        type: DamageEventType.BORDER,
                        attacked: plane.id,
                        damage: plane.health,
                        dead: true,
                    })
                    plane.health = 0
                }
            }

            // Then, check for any intersections for attacks
            const damaged: DamageEvent[] = []
            for (const plane of this.planes.values()) {
                for (const attacking of this.planes.values()) {
                    const result = this.checkPlaneAttackIntersectionResult(
                        subTurn,
                        plane,
                        attacking,
                        alreadyAttackedPairs
                    )
                    if (result !== undefined) {
                        damaged.push(result)
                    }
                }
            }

            // Apply damage after, so we can have plane <-> plane attacks where both die
            for (const { attacked, by, damage, turn, type } of damaged) {
                const plane = this.planes.get(attacked)!

                if (by) {
                    this.players[this.planes.get(by)!.team].damage += damage
                    this.log.addDamageEvent({
                        turn,
                        type,
                        attacked,
                        by,
                        damage,
                        dead: plane.health - damage <= 0,
                    })
                }

                if (plane.health == 0) continue
                plane.health = Math.max(0, plane.health - damage)
            }
        }
    }

    // Runs a turn, returns true if the game should continue, false if it has ended
    async runTurn(): Promise<boolean> {
        Logger.setTurn(this.turn)
        if (this.turn == 0) {
            await this.initPlayerPlanes()
            this.log.addTurn({
                planes: deepCopy(Object.fromEntries(this.planes)),
            })

            this.turn = 1
            return true // No action for turn 0
        }

        // Steer planes
        const angleDiffs = await this.steerPlayerPlanes()

        // Run a set of interpolated steps for each turn
        this.interpolatePlanes(angleDiffs)

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
