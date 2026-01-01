export default function registerSocketHandlers(io, socket){
    console.log("Socket connected:", socket.id);

    // Examplew: user joins their own room
    // const cookie = socket.handshake.headers.cookie; //auth tokens
    

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

    //socket should join thair own room
    socket.on("join_user", ({userId})=>{
        socket.data.userId = userId;
        socket.join(`${userId}`);
        console.log(`User join thair own room: ${userId}`)
    });

   

    socket.on("mark_read", async (mobile)=>{
        try {
            console.log("mobile",mobile)
            const { default: whatsappConversation } = await import("../model/whatsappConversation.js");

            const res = await whatsappConversation.findOneAndUpdate(
                {mobile},
                {unreadCount: 0},
            ); 

            console.log("Conversation marked as read:", res);
        } catch (error) {
            console.error("Error marking conversation as read:", error);
        }
    });


    socket.on("disconnect", () => {
        console.log("Socket disconnected:", socket.id);
    });
}