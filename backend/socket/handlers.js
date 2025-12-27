export default function registerSocketHandlers(io, socket){
    console.log("Socket connected:", socket.id);

    // Examplew: user joins their own room
    // const userId = socket.handshake.query.userId; //auth tokens

    console.log("socketId",socket.id); // socket id will be one clinet it will be admin login
    
    socket.on("join_customer_chat", (d)=>{
        console.log("joining to room chat");
        socket.join(`customer:${d?.customerId}`);
        console.log(`Joined room customer:${d?.customerId}`);

    });


    socket.on("leave_customer_chat",({customerId})=>{
        console.log("leaving prev room chat")
        socket.leave(`customer:${customerId}`);
    });

    socket.on("disconnect", () => {
        console.log("Socket disconnected:", socket.id);
    });
}