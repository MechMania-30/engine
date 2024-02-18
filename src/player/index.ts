import { Plane, PlaneId, PlaneType } from "../plane"

export abstract class Player {
    constructor(readonly team: string) {}

    abstract sendHelloWorld(
        request: HelloWorldRequest
    ): Promise<HelloWorldResponse>
    abstract getPlanesSelected(): Promise<PlaneSelectResponse>
    abstract getSteerInput(
        request: SteerInputRequest
    ): Promise<SteerInputResponse>
    abstract finish(): Promise<void>
}

export enum RequestPhase {
    HELLO_WORLD = "HELLO_WORLD",
    PLANE_SELECT = "PLANE_SELECT",
    STEER_INPUT = "STEER_INPUT",
    FINISH = "FINISH",
}

export type Request =
    | ({ phase: RequestPhase.HELLO_WORLD } & { data: HelloWorldRequest })
    | ({ phase: RequestPhase.PLANE_SELECT } & { data: null })
    | ({ phase: RequestPhase.STEER_INPUT } & { data: SteerInputRequest })
    | ({ phase: RequestPhase.FINISH } & { data: string })

export interface HelloWorldRequest {
    team: string
}
export interface HelloWorldResponse {
    good: boolean
}

export type PlaneSelectResponse = Map<PlaneType, number>

export type SteerInputRequest = Plane[]
export type SteerInputResponse = Map<PlaneId, number>
