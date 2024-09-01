export interface PlaneStats {
    readonly speed: number
    readonly turnSpeed: number
    readonly health: number
    readonly attackSpreadAngle: number
    readonly attackRange: number
    readonly cost: number
}

export enum PlaneType {
    BASIC = "BASIC",
}
