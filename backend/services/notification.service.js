import Notification from "../model/notification.model.js";
import { getIo } from "../socket/index.js";


class NotificationService {
    async createNotification({ userId, relatedCustomerId, title, message, type, metadata = {} }) {
        try {
            const notification = await Notification.create({
                userId,
                relatedCustomerId,
                title,
                message,
                type,
                metadata
            });
            console.log(`[Notification Service] Created ${type} for User ${userId}`);

            // Emit Socket.io event for real-time update
            try {
                const io = getIo();
                io.to(userId.toString()).emit('new_notification', notification);
                console.log(`[Socket] Emitted new_notification to room ${userId}`);
            } catch (ioErr) {
                console.warn("[Notification Service] Socket emission failed:", ioErr.message);
            }

            return notification;
        } catch (error) {
            console.error("[Notification Service] Error creating notification:", error);
            throw error;
        }
    }

    async getNotifications(userId) {
        return await Notification.find({ userId, isDeleted: false })
            .sort({ createdAt: -1 })
            .populate('relatedCustomerId', 'name mobile');
    }

    async countNotifications(userId) {
        return await Notification.countDocuments({ userId, isRead: false, isDeleted: false });
    }

    async markAllRead(userId) {
        return await Notification.updateMany(
            { userId, isRead: false },
            { $set: { isRead: true } }
        );
    }

    async deleteNotification(notificationId, userId) {
        return await Notification.findOneAndUpdate(
            { _id: notificationId, userId },
            { $set: { isDeleted: true } },
            { new: true }
        );
    }
}

export default new NotificationService();
