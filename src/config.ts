import { Direction, PlaneStats, PlaneType, Position } from "./plane"

export const MAP_SIZE = 100 // Size of map
export const TURNS = 500 // Number of turns

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
    [PlaneType.BASIC]: new PlaneStats(4.5, 30, 30, 5),
}
