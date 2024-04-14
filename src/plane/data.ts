export class PlaneStats {
    constructor(
        readonly speed: number,
        readonly turnSpeed: number,
        readonly health: number,
        readonly attackSpreadAngle: number,
        readonly attackRange: number
    ) {}
}

export enum PlaneType {
    BASIC = "BASIC",
}
