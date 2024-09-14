import { z } from "zod"
import {
    Player,
    Request,
    RequestPhase,
    PlaneSelectResponse,
    SteerInputRequest,
    SteerInputResponse,
    HelloWorldResponse,
    HelloWorldRequest,
    PlaneSelectResponseSchema,
    HelloWorldResponseSchema,
    SteerInputResponseSchema,
} from "."
import * as CONFIG from "../config"
import { Log } from "../log"
import SocketServer from "../util/socket-server"

export default class NetworkPlayer extends Player {
    constructor(
        team: number,
        private readonly server: SocketServer,
        private log: Log,
        private disconnectStrikes: number = 0
    ) {
        super(team)
    }

    private send(request: Request) {
        if (!this.server.connected()) {
            return
        }
        return this.server.write(JSON.stringify(request))
    }

    private async parseReceived<T, I>(
        read: string,
        schema: z.ZodType<T, z.ZodTypeDef, I>
    ): Promise<{ valid: true; data: T } | { valid: false; error: string }> {
        if (read === "") {
            return {
                valid: false,
                error: `timed out`,
            }
        }

        let data = undefined
        try {
            data = JSON.parse(read)
        } catch (e) {
            return {
                valid: false,
                error: `sent invalid json (${e})`,
            }
        }

        const parseResult = schema.safeParse(data)
        if (!parseResult.success) {
            return {
                valid: false,
                error: `sent incorrectly formatted data (${parseResult.error.message})`,
            }
        }

        return {
            valid: true,
            data: parseResult.data,
        }
    }

    private async receive<T, I>(
        schema: z.ZodType<T, z.ZodTypeDef, I>
    ): Promise<T | undefined> {
        if (!this.server.connected()) {
            return
        }
        const read = await this.server.read()

        const result = await this.parseReceived(read, schema)
        if (!result.valid) {
            this.disconnectStrikes += 1
            this.log.logValidationError(
                this.team,
                `${result.error}, strike ${this.disconnectStrikes}/${CONFIG.DISCONNECT_STRIKES}`
            )

            if (this.disconnectStrikes >= CONFIG.DISCONNECT_STRIKES) {
                await this.finish(
                    `Your bot failed to respond ${this.disconnectStrikes} times in a row (is your bot broken?) and was disconnected`
                )
                this.log.logValidationError(
                    this.team,
                    `failed to respond ${this.disconnectStrikes} times in a row and was disconnected due to broken bot`
                )
            }
            return
        }

        this.disconnectStrikes = 0

        return result.data
    }

    async sendHelloWorld(
        request: HelloWorldRequest
    ): Promise<HelloWorldResponse> {
        await this.send({
            phase: RequestPhase.HELLO_WORLD,
            data: request,
        })

        const result = await this.receive(HelloWorldResponseSchema)
        return result || { good: true }
    }

    async getPlanesSelected(): Promise<PlaneSelectResponse> {
        await this.send({
            phase: RequestPhase.PLANE_SELECT,
            data: null,
        })

        const response = await this.receive(PlaneSelectResponseSchema)
        return response || new Map()
    }

    async getSteerInput(
        request: SteerInputRequest
    ): Promise<SteerInputResponse> {
        await this.send({
            phase: RequestPhase.STEER_INPUT,
            data: request,
        })

        const result = await this.receive(SteerInputResponseSchema)
        return result || new Map()
    }

    async finish(disconnectMessage: string): Promise<void> {
        await this.send({
            phase: RequestPhase.FINISH,
            data: disconnectMessage,
        })

        this.server.close()
    }
}
