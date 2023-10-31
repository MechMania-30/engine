import net from "net"

const TIMEOUT = 5000

export default class SocketServer {
    private server: net.Server | undefined
    private socket: net.Socket | undefined
    private buffer: string = ""

    async connect(port: number) {
        this.server = await new Promise<net.Server>((res) => {
            const server = net.createServer((socket) => {
                this.socket = socket
                res(server)
            })
            server.listen(port)
        })
    }

    public async write(data: string): Promise<void> {
        if (!this.socket) {
            console.log("Socket is closed!")
            return
        }

        return new Promise((resolve) => {
            const timeout = setTimeout(() => {
                console.log("Write timed out!")
                resolve()
            }, TIMEOUT)

            this.socket!.write(`${data}\n`, () => {
                clearTimeout(timeout)
                resolve()
            })
        })
    }

    public async read(): Promise<string> {
        if (!this.socket) {
            console.log("Socket is closed!")
            return ""
        }

        return new Promise((resolve) => {
            const timeout = setTimeout(() => {
                console.log("Read timed out!")
                resolve("")
            }, TIMEOUT)

            this.socket!.on("data", (data) => {
                this.buffer += data.toString()
                if (this.buffer.includes("\n")) {
                    clearTimeout(timeout)
                    const message = this.buffer.trim()
                    this.buffer = ""
                    resolve(message)
                }
            })
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
        console.log("Connection closed!")
    }
}
