import { writeFileSync } from "fs"
import Game from "./game"
import { Player } from "./player"
import ComputerPlayer from "./player/computer"
import NetworkPlayer from "./player/network"
import SocketServer from "./util/socket-server"
import { mkdir } from "fs/promises"
import path from "path"
import { Log } from "./log"

const USAGE = `Proper usage: npm start [team0port] [team1port]

    Env variables:
    OUTPUT = The location to which the gamelog will be output, defaults to gamelogs/game_DATE.json
    DEBUG = Set to 1 to enable debug output
`

async function setupPlayerForPort(
    team: number,
    port: number,
    log: Log
): Promise<Player> {
    if (port <= 0) {
        console.log(`Created computer for team ${team}`)
        return new ComputerPlayer(team)
    }

    console.log(`Waiting for connection from team ${team} on ${port}`)
    const server = new SocketServer()
    await server.connect(port)
    console.log(`Connected to team ${team} on ${port}`)

    return new NetworkPlayer(team, server, log)
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

    const log = new Log()

    const players = await Promise.all([
        setupPlayerForPort(0, team0Port, log),
        setupPlayerForPort(1, team1Port, log),
    ])

    const game = new Game(players, log)

    let continues = true
    while (continues) {
        continues = await game.runTurn()
    }

    const OUTPUT =
        process.env["OUTPUT"] ||
        `./gamelogs/gamelog_${
            new Date().toISOString().replace(/[-:]/g, "_").split(".")[0]
        }.json`

    await mkdir(path.dirname(OUTPUT), {
        recursive: true,
    })

    await writeFileSync(OUTPUT, log.toString())
}

main()
