import {
    Player,
    PlaneSelectResponse,
    SteerInputRequest,
    SteerInputResponse,
    HelloWorldRequest,
    HelloWorldResponse,
} from "."
import { PlaneType } from "../plane"

export default class ComputerPlayer extends Player {
    async sendHelloWorld(
        _request: HelloWorldRequest
    ): Promise<HelloWorldResponse> {
        return {
            good: true,
        }
    }

    async getPlanesSelected(): Promise<PlaneSelectResponse> {
        // Ask for a random number of basic planes
        const selectedPlanes: PlaneSelectResponse = new Map([
            [PlaneType.BASIC, Math.floor(5 + Math.random() * 6)],
        ])

        return selectedPlanes
    }

    async getSteerInput(
        _request: SteerInputRequest
    ): Promise<SteerInputResponse> {
        return new Map()
    }

    async finish(): Promise<void> {
        // Do nothing
    }
}
