import { Server } from "socket.io";
import registerSocketHandlers from "./handlers.js"

let ioInstance;

export function initSocket(server) {
    const io = new Server(server, {
        cors: {
            origin: "http://localhost:5173",
            methods: ["*"],
            credentials: true
        }
    }) // have to check cors later
    ioInstance = io;

    io.on("connection", (socket) => {
        console.log(`[Socket] New connection: ${socket.id}`);

        socket.emit("welcome", {
            text: "Welcome to the socket server",
        });

        registerSocketHandlers(io, socket);

        socket.on("disconnect", () => {
            console.log(`[Socket] User disconnected: ${socket.id}`);
        })
    });

    return io;

}

export function getIo() {
    if (!ioInstance) {
        throw new Error("Socket.io not initialized");

    }
    return ioInstance;

}