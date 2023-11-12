import { writeFileSync } from "fs"
import Game from "./game"
import { Player } from "./player"
import ComputerPlayer from "./player/computer"
import NetworkPlayer from "./player/network"
import SocketServer from "./util/socket-server"
import { mkdir } from "fs/promises"
import path from "path"

const USAGE = `Proper usage: npm start [team0port] [team1port]

    Env variables:
    OUTPUT = The location to which the gamelog will be output, defaults to gamelogs/game_DATE.json
    DEBUG = Set to 1 to enable debug output
`

async function setupPlayerForPort(team: string, port: number): Promise<Player> {
    if (port <= 0) {
        console.log(`Created computer for team ${team}`)
        return new ComputerPlayer(team)
    }

    console.log(`Waiting for connection from team ${team} on ${port}`)
    const server = new SocketServer()
    await server.connect(port)
    console.log(`Connected to team ${team} on ${port}`)

    return new NetworkPlayer(team, server)
}

async function main() {
    if (process.argv.length != 4) {
        throw new Error(USAGE)
    }

    let team0Port: number | undefined = undefined

    try {
        team0Port = parseInt(process.argv[2])
    } catch {
        // pass
    }

    if (team0Port === undefined || Number.isNaN(team0Port)) {
        throw new Error("Team 0 port must be a number!")
    }

    let team1Port: number | undefined = undefined
    try {
        team1Port = parseInt(process.argv[3])
    } catch {
        // pass
    }

    if (team1Port === undefined || Number.isNaN(team1Port)) {
        throw new Error("Team 1 port must be a number!")
    }

    const [player0, player1] = await Promise.all([
        setupPlayerForPort("team0", team0Port),
        setupPlayerForPort("team1", team1Port),
    ])

    const game = new Game(player0, player1)

    for (let i = 0; i < 100; i++) {
        console.log(`Start turn ${i}`)
        await game.runTurn()
    }

    await game.finish()

    const OUTPUT =
        process.env["OUTPUT"] ||
        `./gamelogs/gamelog_${
            new Date().toISOString().replace(/[-:]/g, "_").split(".")[0]
        }.json`

    await mkdir(path.dirname(OUTPUT), {
        recursive: true,
    })

    await writeFileSync(
        OUTPUT,
        JSON.stringify(
            {
                theAnswer: 42,
            },
            undefined,
            "\t"
        )
    )
}

main()
