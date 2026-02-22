export default function registerSocketHandlers(io, socket) {
    const user = socket.request.user;
    console.log(`[Socket] Authenticated user connected: ${user.email} (${socket.id})`);

    // Automatically join the user to their private room upon connection
    const userId = user._id.toString();
    socket.join(userId);
    socket.data.userId = userId;
    console.log(`[Socket] User ${userId} automatically joined their private room.`);

    // Handle marking a specific notification as read from the client side if needed
    socket.on("notification_read", ({ notificationId }) => {
        // This could complement the HTTP endpoint
        console.log(`[Socket] User marked notification ${notificationId} as read.`);
    });

    socket.on("disconnect", () => {
        console.log("Socket disconnected:", socket.id);
    });
}