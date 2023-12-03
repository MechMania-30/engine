import { PlaneType } from "../plane"

export abstract class Player {
    constructor(readonly team: string) {}

    abstract getPlanesSelected(
        request: PlaneSelectRequest
    ): Promise<PlaneSelectResponse>
    abstract finish(): Promise<void>
}

export enum RequestPhase {
    PLANE_SELECT = "PLANE_SELECT",
    STEER_INPUT = "STEER_INPUT",
    FINISH = "FINISH",
}

export type Request =
    | ({ phase: RequestPhase.PLANE_SELECT } & { data: PlaneSelectRequest })
    | ({ phase: RequestPhase.STEER_INPUT } & { data: SteerInputRequest })
    | ({ phase: RequestPhase.FINISH } & { data: string })

export interface PlaneSelectRequest {}

export type PlaneSelectResponse = Map<PlaneType, number>

// TODO
export interface SteerInputRequest {}

export interface SteerInputResponse {}
