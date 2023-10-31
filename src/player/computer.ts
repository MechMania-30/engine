import { HelloWorldRequest, HelloWorldResponse, Player } from "."

export default class ComputerPlayer extends Player {
    async getHello(_request: HelloWorldRequest): Promise<HelloWorldResponse> {
        return {
            good: false,
        }
    }

    async finish(): Promise<void> {
        // Do nothing
    }
}
