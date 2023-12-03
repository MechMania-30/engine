import { Direction, PlaneStats, PlaneType, Position } from "./plane"

export const MAP_SIZE = 100 // Size of map
export const TURNS = 500 // Number of turns

// Possible teams
export const TEAMS = {
    ZERO: "team0",
    ONE: "team1",
}

// Map each team to their spawn center
export const SPAWNS: {
    [x: string]: {
        position: Position
        angle: number
    }
} = {
    [TEAMS.ZERO]: {
        position: new Position(MAP_SIZE / 2, 5),
        angle: Direction.SOUTH,
    },
    [TEAMS.ONE]: {
        position: new Position(MAP_SIZE / 2, MAP_SIZE - 5),
        angle: Direction.NORTH,
    },
}
export const PLANE_SPAWN_SPREAD = 2.5 // How far apart planes from same team spawn from each other

// Plane type => plane stats
export const PLANE_STATS: Record<PlaneType, PlaneStats> = {
    [PlaneType.BASIC]: new PlaneStats(4.5),
}
