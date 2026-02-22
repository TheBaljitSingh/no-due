import Notification from "../model/notification.model.js";

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

            // TODO: In future, trigger Socket.io event here
            // this.io.to(userId.toString()).emit('new_notification', notification);

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

    async countNotifications(userId){
        return await Notification.countDocuments({ userId, isRead: false, isDeleted:false });
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
