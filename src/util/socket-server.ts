import net from "net"
import { INITIAL_RESPONSE_TIMEOUT, RESPONSE_TIMEOUT } from "../config"

export default class SocketServer {
    private server: net.Server | undefined
    private socket: net.Socket | undefined
    private buffer: string = ""

    async connect(port: number) {
        this.server = await new Promise((res) => {
            let timeout: NodeJS.Timeout | undefined = undefined

            const server = net.createServer((socket) => {
                this.socket = socket
                clearTimeout(timeout)
                res(server)
            })
            server.listen(port)

            timeout = setTimeout(() => {
                server.close()
                res(undefined)
            }, INITIAL_RESPONSE_TIMEOUT)
        })
    }

    public connected(): boolean {
        return !!this.socket
    }

    public async write(data: string): Promise<void> {
        if (!this.connected()) {
            throw new Error("Cannot write to closed socket")
        }

        return new Promise((resolve) => {
            const timeout = setTimeout(() => {
                resolve()
            }, RESPONSE_TIMEOUT)

            this.socket!.write(`${data}\n`, () => {
                clearTimeout(timeout)
                resolve()
            })
        })
    }

    public async read(): Promise<string> {
        if (!this.connected()) {
            throw new Error("Cannot read from closed socket")
        }

        return new Promise((resolve) => {
            const handler = (data: Buffer) => {
                this.buffer += data.toString()
                if (this.buffer.includes("\n")) {
                    clearTimeout(timeout)
                    const message = this.buffer.trim()
                    this.buffer = ""
                    this.socket!.removeListener("data", handler)
                    resolve(message)
                }
            }

            const timeout = setTimeout(() => {
                this.socket!.removeListener("data", handler)
                resolve("")
            }, RESPONSE_TIMEOUT)

            this.socket!.on("data", handler)
        })
    }

    async close(): Promise<void> {
        if (this.server) {
            this.server.removeAllListeners()
            this.server.close()
        }
        if (this.socket) {
            this.socket.removeAllListeners()
            this.socket.destroy()
        }
        this.server = undefined
        this.socket = undefined
    }
}
