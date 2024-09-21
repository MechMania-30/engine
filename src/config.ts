import { PlaneStats, PlaneType } from "./plane/data"
import { Direction, Vector } from "./plane/vector"

export const MAP_SIZE = 100 // Size of map
export const TURNS = 500 // Number of turns
export const MAX_SPEND = 1000 // The maximum points that can be spent on planes
export const ATTACK_STEPS = 15 // Number of steps per attack detection
export const COLLISION_RADIUS = 1 // Distance at which planes collide and both explode

export const INITIAL_RESPONSE_TIMEOUT = 15_000 // The number of milliseconds allowed for a client to connect before they are disconnected
export const RESPONSE_TIMEOUT = 2_500 // The number of milliseconds allowed before a read/write times out, gives a disconnect strike
export const DISCONNECT_STRIKES = 3 // The number of disconnect strikes before the client is disconnected and ignored

export const DEBUG = !["0", "", undefined].includes(process.env.DEBUG)

// Spawns for each team
export const SPAWNS: { position: Vector; angle: number }[] = [
    {
        position: new Vector(0, MAP_SIZE / 2 - 5),
        angle: Direction.SOUTH,
    },
    {
        position: new Vector(0, -MAP_SIZE / 2 + 5),
        angle: Direction.NORTH,
    },
]
export const PLANE_SPAWN_SPREAD = 2.5 // How far apart planes from same team spawn from each other

// Plane type => plane stats
export const PLANE_STATS: Record<PlaneType, PlaneStats> = {
    [PlaneType.STANDARD]: {
        cost: 200,
        maxHealth: 20,
        turnSpeed: 15,
        speed: 2,
        attack: 1,
        attackRange: 5,
        attackSpreadAngle: 30,
    },
    [PlaneType.FLYING_FORTRESS]: {
        cost: 300,
        maxHealth: 30,
        turnSpeed: 10,
        speed: 1,
        attack: 1,
        attackRange: 8,
        attackSpreadAngle: 30,
    },
    [PlaneType.THUNDERBIRD]: {
        cost: 200,
        maxHealth: 10,
        turnSpeed: 15,
        speed: 2.5,
        attack: 1,
        attackRange: 5,
        attackSpreadAngle: 30,
    },
    [PlaneType.SCRAPYARD_RESCUE]: {
        cost: 100,
        maxHealth: 5,
        turnSpeed: 10,
        speed: 1.5,
        attack: 1,
        attackRange: 4,
        attackSpreadAngle: 20,
    },
    [PlaneType.PIGEON]: {
        cost: 10,
        maxHealth: 1,
        turnSpeed: 30,
        speed: 0.5,
        attack: 0,
        attackRange: 0,
        attackSpreadAngle: 0,
    },
}
