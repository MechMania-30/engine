import { z } from "zod"
import { PlaneType } from "../plane/data"
import { Plane } from "../plane/plane"
import { objectToMap } from "../util/schema"

export abstract class Player {
    constructor(
        readonly team: number,
        public damage: number = 0
    ) {}

    abstract sendHelloWorld(
        request: HelloWorldRequest
    ): Promise<HelloWorldResponse>
    abstract getPlanesSelected(): Promise<PlaneSelectResponse>
    abstract getSteerInput(
        request: SteerInputRequest
    ): Promise<SteerInputResponse>
    abstract finish(disconnectMessage: string): Promise<void>
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
    team: number
}

export const HelloWorldResponseSchema = z.object({
    good: z.literal(true),
})
export type HelloWorldResponse = z.infer<typeof HelloWorldResponseSchema>

export const PlaneSelectResponseSchema = z
    .record(z.nativeEnum(PlaneType), z.number())
    .transform(objectToMap)
export type PlaneSelectResponse = z.infer<typeof PlaneSelectResponseSchema>

export type SteerInputRequest = Record<string, Plane>
export const SteerInputResponseSchema = z
    .record(z.string(), z.number())
    .transform(objectToMap)
export type SteerInputResponse = z.infer<typeof SteerInputResponseSchema>
