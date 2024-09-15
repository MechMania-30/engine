export interface PlaneStats {
    readonly cost: number
    readonly maxHealth: number
    readonly turnSpeed: number
    readonly speed: number
    readonly attack: number
    readonly attackSpreadAngle: number
    readonly attackRange: number
}

export enum PlaneType {
    STANDARD = "STANDARD",
    FLYING_FORTRESS = "FLYING_FORTRESS",
    THUNDERBIRD = "THUNDERBIRD",
    SCRAPYARD_RESCUE = "SCRAPYARD_RESCUE",
    PIGEON = "PIGEON",
}
