import {
    Player,
    Request,
    RequestPhase,
    PlaneSelectResponse,
    SteerInputRequest,
    SteerInputResponse,
    HelloWorldResponse,
    HelloWorldRequest,
} from "."
import * as CONFIG from "../config"
import { PlaneType } from "../plane/data"
import { PlaneId } from "../plane/plane"
import SocketServer from "../util/socket-server"

export default class NetworkPlayer extends Player {
    constructor(
        team: number,
        private readonly server: SocketServer,
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

    private async receive() {
        if (!this.server.connected()) {
            return "{}"
        }
        const read = await this.server.read()
        if (read === "") {
            this.disconnectStrikes += 1
            if (this.disconnectStrikes >= CONFIG.TIMEOUT_DISCONNECT_STRIKES) {
                console.log(this.disconnectStrikes)
                await this.finish(
                    "Your bot failed to respond in time (is your bot broken?) and was disconnected"
                )
                console.error(
                    `[Validation] Player ${this.team} failed to respond ${this.disconnectStrikes} times in a row and was disconnected due to broken bot`
                )
                return "{}"
            } else {
                console.error(
                    `[Validation] Player ${this.team} timed out, strike ${this.disconnectStrikes}/${CONFIG.TIMEOUT_DISCONNECT_STRIKES}`
                )
            }
            return "{}"
        }
        this.disconnectStrikes = 0
        return read
    }

    async sendHelloWorld(
        request: HelloWorldRequest
    ): Promise<HelloWorldResponse> {
        await this.send({
            phase: RequestPhase.HELLO_WORLD,
            data: request,
        })

        return JSON.parse(await this.receive())
    }

    async getPlanesSelected(): Promise<PlaneSelectResponse> {
        await this.send({
            phase: RequestPhase.PLANE_SELECT,
            data: null,
        })

        const got = await this.receive()

        const rawResponse = JSON.parse(got)

        console.log(rawResponse)

        const response = new Map<PlaneType, number>()

        for (const [key, value] of Object.entries(rawResponse)) {
            response.set(key as PlaneType, value as number)
        }

        return response
    }

    async getSteerInput(
        request: SteerInputRequest
    ): Promise<SteerInputResponse> {
        await this.send({
            phase: RequestPhase.STEER_INPUT,
            data: request,
        })

        const got = await this.receive()

        const rawResponse = JSON.parse(got)

        const response = new Map<PlaneId, number>()

        for (const [key, value] of Object.entries(rawResponse)) {
            response.set(key, value as number)
        }

        return response
    }

    async finish(disconnectMessage: string): Promise<void> {
        await this.send({
            phase: RequestPhase.FINISH,
            data: disconnectMessage,
        })

        this.server.close()
    }
}
