import express from "express";
import { isAuthenticated } from "../middleware/authMiddleware.js";
import { getNotifications, markAllNotificationsAsRead, deleteNotification } from "../controller/notification.controller.js";

const router = express.Router();

router.use(isAuthenticated);
//routes are protected because this routes will be used by user(company)

router.get("/", getNotifications);
router.put("/mark-all-read", markAllNotificationsAsRead);
router.delete("/:notificationId", deleteNotification);


export default router;