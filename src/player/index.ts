export abstract class Player {
    constructor(readonly teamName: string) {}

    abstract getHello(request: HelloWorldRequest): Promise<HelloWorldResponse>
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
    | ({ phase: RequestPhase.PLANE_SELECT } & { data: PlaneSelectRequest })
    | ({ phase: RequestPhase.STEER_INPUT } & { data: SteerInputRequest })
    | ({ phase: RequestPhase.FINISH } & { data: string })

export interface HelloWorldRequest {
    message: string
}

export interface HelloWorldResponse {
    good: boolean
}

// TODO
export interface PlaneSelectRequest {}

export interface PlaceSelectResponse {}

// TODO
export interface SteerInputRequest {}

export interface SteerInputResponse {}
