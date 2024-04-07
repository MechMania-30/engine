import {
    Player,
    Request,
    RequestPhase,
    PlaneSelectResponse,
    SteerInputRequest,
    SteerInputResponse,
    HelloWorldResponse,
} from "."
import { PlaneType } from "../plane/data"
import { PlaneId } from "../plane/plane"
import SocketServer from "../util/socket-server"

export default class NetworkPlayer extends Player {
    constructor(
        team: number,
        private readonly server: SocketServer
    ) {
        super(team)
    }

    private send(request: Request) {
        return this.server.write(JSON.stringify(request))
    }

    private receive() {
        return this.server.read()
    }

    async sendHelloWorld(): Promise<HelloWorldResponse> {
        await this.send({
            phase: RequestPhase.HELLO_WORLD,
            data: {
                team: this.team,
            },
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

    async finish(): Promise<void> {
        await this.send({
            phase: RequestPhase.FINISH,
            data: "",
        })

        this.server.close()
    }
}
