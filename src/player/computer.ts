import {
    HelloWorldRequest,
    HelloWorldResponse,
    Player,
    PlaneSelectRequest,
    PlaneSelectResponse,
} from "."
import { PlaneType } from "../plane"

export default class ComputerPlayer extends Player {
    async getHello(_request: HelloWorldRequest): Promise<HelloWorldResponse> {
        return {
            good: false,
        }
    }

    async getPlanesSelected(
        _request: PlaneSelectRequest
    ): Promise<PlaneSelectResponse> {
        // Ask for a random number of basic planes
        const selectedPlanes: PlaneSelectResponse = [
            {
                type: PlaneType.BASIC,
                count: Math.ceil(5 + Math.random() * 5),
            },
        ]

        return selectedPlanes
    }

    async finish(): Promise<void> {
        // Do nothing
    }
}
