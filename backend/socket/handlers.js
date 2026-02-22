export default function registerSocketHandlers(io, socket) {
    console.log("Socket connected:", socket.id);

    // User joins their own room to receive private notifications
    socket.on("join_user", ({ userId }) => {
        if (!userId) return;
        socket.data.userId = userId;
        socket.join(`${userId}`);
        console.log(`[Socket] User ${userId} joined their private room.`);
    });

    // Handle marking a specific notification as read from the client side if needed
    socket.on("notification_read", ({ notificationId }) => {
        // This could complement the HTTP endpoint
        console.log(`[Socket] User marked notification ${notificationId} as read.`);
    });

    socket.on("disconnect", () => {
        console.log("Socket disconnected:", socket.id);
    });
}