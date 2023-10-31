import {
    HelloWorldRequest,
    HelloWorldResponse,
    Player,
    Request,
    RequestPhase,
} from "."
import SocketServer from "../util/socket-server"

export default class NetworkPlayer extends Player {
    constructor(
        teamName: string,
        private readonly server: SocketServer
    ) {
        super(teamName)
    }

    private send(request: Request) {
        return this.server.write(JSON.stringify(request))
    }

    private receive() {
        return this.server.read()
    }

    async getHello(request: HelloWorldRequest): Promise<HelloWorldResponse> {
        await this.send({
            phase: RequestPhase.HELLO_WORLD,
            data: request,
        })

        const got = await this.receive()

        const response = JSON.parse(got) as HelloWorldResponse

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
