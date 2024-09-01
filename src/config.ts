import { PlaneStats, PlaneType } from "./plane/data"
import { Direction, Position } from "./plane/position"

export const MAP_SIZE = 100 // Size of map
export const TURNS = 500 // Number of turns
export const MAX_SPEND = 1000 // The maximum points that can be spent on planes
export const ATTACK_STEPS = 15 // Number of steps per attack detection
export const COLLISION_RADIUS = 2 // Distance at which planes collide and both explode

// Spawns for each team
export const SPAWNS: { position: Position; angle: number }[] = [
    {
        position: new Position(0, MAP_SIZE / 2 - 5),
        angle: Direction.SOUTH,
    },
    {
        position: new Position(0, -MAP_SIZE / 2 + 5),
        angle: Direction.NORTH,
    },
]
export const PLANE_SPAWN_SPREAD = 2.5 // How far apart planes from same team spawn from each other

// Plane type => plane stats
export const PLANE_STATS: Record<PlaneType, PlaneStats> = {
    [PlaneType.BASIC]: {
        speed: 4.5,
        turnSpeed: 15,
        health: 1,
        attackSpreadAngle: 30,
        attackRange: 5,
        cost: 100,
    },
}
