import {
    Player,
    PlaneSelectResponse,
    SteerInputRequest,
    SteerInputResponse,
    HelloWorldResponse,
    HelloWorldRequest,
} from "."
import { PlaneType } from "../plane/data"

export default class ComputerPlayer extends Player {
    private counter = 0
    private steers: Map<string, number> = new Map()

    async sendHelloWorld(_: HelloWorldRequest): Promise<HelloWorldResponse> {
        return {
            good: true,
        }
    }

    async getPlanesSelected(): Promise<PlaneSelectResponse> {
        // Ask for a random number of basic planes
        const selectedPlanes: PlaneSelectResponse = new Map([
            [PlaneType.STANDARD, Math.floor(3 + Math.random() * 2)],
        ])

        return selectedPlanes
    }

    async getSteerInput(
        request: SteerInputRequest
    ): Promise<SteerInputResponse> {
        this.counter += 1
        if (this.counter === 1) {
            const peak = Math.max(
                ...Object.values(request).map((plane) =>
                    Math.abs(plane.position.x)
                )
            )
            for (const [id, plane] of Object.entries(request)) {
                this.steers.set(
                    id,
                    (plane.position.x / peak) *
                        0.5 *
                        Math.sign(plane.position.y)
                )
            }
        }
        if (this.counter < 5 || (this.counter >= 10 && this.counter <= 12)) {
            return new Map()
        }

        if (this.counter === 13) {
            for (const id of this.steers.keys()) {
                this.steers.set(id, this.steers.get(id)! > 0 ? -1 : 1)
            }
        }

        return this.steers
    }

    async finish(_disconnectMessage: string): Promise<void> {
        // Do nothing
    }
}
