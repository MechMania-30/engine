export enum PlaneType {
    BASIC = "BASIC",
}

export class Plane {
    constructor(
        readonly team: string,
        readonly type: PlaneType
    ) {}
}
