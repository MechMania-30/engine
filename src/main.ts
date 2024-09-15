import { writeFileSync } from "fs"
import Game from "./game"
import { Player } from "./player"
import ComputerPlayer from "./player/computer"
import NetworkPlayer from "./player/network"
import SocketServer from "./util/socket-server"
import { mkdir } from "fs/promises"
import path from "path"
import { Log } from "./log"
import { exit } from "process"

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
    if (server.connected()) {
        console.log(`Connected to team ${team} on ${port}`)
    } else {
        console.error(`Failed to connect to team ${team} on ${port}`)
    }

    return new NetworkPlayer(team, server, log)
}

async function main() {
    if (process.argv.length != 4) {
        console.error(USAGE)
        exit(2)
    }

    let team0Port: number | undefined = undefined

    try {
        team0Port = parseInt(process.argv[2])
    } catch {
        // pass
    }

    if (team0Port === undefined || Number.isNaN(team0Port)) {
        console.error("Team 0 port must be a number!")
        exit(2)
    }

    let team1Port: number | undefined = undefined
    try {
        team1Port = parseInt(process.argv[3])
    } catch {
        // pass
    }

    if (team1Port === undefined || Number.isNaN(team1Port)) {
        console.error("Team 1 port must be a number!")
        exit(2)
    }

    const log = new Log()

    const players = await Promise.all([
        setupPlayerForPort(0, team0Port, log),
        setupPlayerForPort(1, team1Port, log),
    ])

    console.log("Game started!")
    const game = new Game(players, log)

    let continues = true
    while (continues) {
        continues = await game.runTurn()
    }

    console.log("Game ended!")

    const OUTPUT =
        process.env["OUTPUT"] ||
        `./gamelogs/gamelog_${
            new Date().toISOString().replace(/[-:]/g, "_").split(".")[0]
        }.json`

    console.log(`Writing gamelog to ${OUTPUT}...`)

    await mkdir(path.dirname(OUTPUT), {
        recursive: true,
    })

    await writeFileSync(OUTPUT, log.toString())
    console.log("Done")
}

main()
