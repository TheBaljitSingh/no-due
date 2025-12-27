import { Server } from "socket.io";
import registerSocketHandlers from "./handlers.js"

let ioInstance;

export function initSocket(server){
    const io = new Server(server, {
        cors:{
            origin:"http://localhost:5173",
            methods:["*"],
            credentials: true
        }
}) // have to check cors later
    ioInstance = io;

    io.on("connection", (socket)=>{
        socket.emit("welcome", {
            // id:'id121',
            text:"Welcome to the socket server",
            // // time:new Date(),
            // direction:"incomming",

        });
        registerSocketHandlers(io, socket);

        console.log("socket rooms:",socket.rooms);



        //for disconnect
        socket.on("disconnect", ()=>{
            console.log("user socket disconnected");
        })
    });

    return io;

}

export function getIo(){
    if(!ioInstance){
        throw new Error("Socket.io not initialized");

    }
    return ioInstance;
    
}