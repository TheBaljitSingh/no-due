import { APIError } from "../utils/ResponseAndError/ApiError.utils.js";
import { APIResponse } from "../utils/ResponseAndError/ApiResponse.utils.js";
import notificationService from "../services/notification.service.js";

export const getNotifications = async (req, res) => {
    console.log("getNotifications");
    //there is not pagination is required because i will fetch all notifications on the dashboard
    try {
        const userId = req.user._id;
        const notifications = await notificationService.getNotifications(userId);
        const unreadCount = await notificationService.countNotifications(userId);
        return new APIResponse(200, {notifications, unreadCount}, "Notifications fetched successfully").send(res);
    } catch (error) {
        console.log("error in getNotifications", error);
        return new APIError(500, error?.message || "Internal server error", "Internal server error").send(res);
    }
}

export const markAllNotificationsAsRead = async (req, res) => {
    console.log("markAllNotificationsAsRead");
    try {
        const userId = req.user._id;
        await notificationService.markAllRead(userId);
        return new APIResponse(200, null, "All notifications marked as read").send(res);
    } catch (error) {
        console.log("error in markAllNotificationsAsRead", error);
        return new APIError(500, error?.message || "Internal server error").send(res);
    }
}

export const deleteNotification = async (req, res) => {
    console.log("deleteNotification");
    try {
        const { notificationId } = req.params;
        const userId = req.user._id;
        await notificationService.deleteNotification(notificationId, userId);
        return new APIResponse(200, null, "Notification deleted successfully").send(res);
    } catch (error) {
        console.log("error in deleteNotification", error);
        return new APIError(500, error?.message || "Internal server error").send(res);
    }
}