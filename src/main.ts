import Game from "./game"
import ComputerPlayer from "./player/computer"
import NetworkPlayer from "./player/network"
import SocketServer from "./util/socket-server"

async function main() {
    const player0Client = new SocketServer()
    await player0Client.connect(3000)

    const player0 = new NetworkPlayer("network0", player0Client)
    const player1 = new ComputerPlayer("computer1")

    const game = new Game(player0, player1)

    for (let i = 0; i < 100; i++) {
        console.log(`Start turn ${i}`)
        await game.runTurn()
    }

    await game.finish()
}

main()
