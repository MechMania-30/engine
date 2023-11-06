import { HelloWorldRequest, HelloWorldResponse, Player, PlaneSelectRequest, PlaneSelectResponse } from "."
import { PlaneType } from "../plane";

export default class ComputerPlayer extends Player {
    async getHello(_request: HelloWorldRequest): Promise<HelloWorldResponse> {
        return {
            good: false,
        }
    }

    async finish(): Promise<void> {
        // Do nothing
    }

    async getPlanesSelected(_request: PlaneSelectRequest): Promise<PlaneSelectResponse> {
        // Implement the logic to select planes for the Computer player (random for now)
        // Do you plan to just use randomstrategy here?
        // I just put Math line for testing purposes
        const selectedPlanes: PlaneSelectResponse = [{
            type: PlaneType.BASIC,
            count: Math.ceil(Math.random() * 5),
        }];

        return selectedPlanes;
    }
}
