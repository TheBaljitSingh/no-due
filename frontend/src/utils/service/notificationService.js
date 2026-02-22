import api from "./api";

const notificationService = {
    getNotifications: async () => {
        try {
            const response = await api.get("/v1/notifications");
            console.log("notification", response);
            return response.data;
        } catch (error) {
            console.error("Error fetching notifications:", error);
            throw error;
        }
    },

    markAllRead: async () => {
        try {
            const response = await api.put("/v1/notifications/mark-all-read");
            console.log("mark all read", response);
            return response.data;
        } catch (error) {
            console.error("Error marking all read:", error);
            throw error;
        }
    },

    deleteNotification: async (notificationId) => {
        try {
            const response = await api.delete(`/v1/notifications/${notificationId}`);
            console.log("response of deleted notificaitons", response);
            return response.data;
        } catch (error) {
            console.error("Error deleting notification:", error);
            throw error;
        }
    },
};

export default notificationService;
