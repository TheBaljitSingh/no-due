import { Server } from "socket.io";
import registerSocketHandlers from "./handlers.js"
import cookieParser from "cookie-parser";
import { sessionMiddleware } from "../config/sessionConfig.js";
import passport from "../utils/passportSetup/passportSetup.js";

let ioInstance;

export function initSocket(server) {
    const io = new Server(server, {
        cors: {
            origin: process.env.CLIENT_BASE_URL,
            methods: ["*"],
            credentials: true
        }
    }) // have to check cors later
    ioInstance = io;

    // Middleware to wrap express middleware for Socket.io
    const wrap = middleware => (socket, next) => middleware(socket.request, {}, next);
    //formatted in (req,res,next)

    // Use common express middleware
    io.use(wrap(cookieParser()));
    io.use(wrap(sessionMiddleware));
    io.use(wrap(passport.initialize()));
    io.use(wrap(passport.session()));

    // Verify authentication
    io.use((socket, next) => {
        if (socket.request.user) {
            next();
        } else {
            console.log("[Socket] Connection rejected: Unauthenticated");
            next(new Error("unauthorized"));
        }
    });

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