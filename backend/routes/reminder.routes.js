import express from "express";
import {
    getAllReminders,
    scheduleWhatsappReminder,
    sendWhatsappReminder,
    getCustomerReminderHistory,
    deleteReminder,
    rescheduleReminder,
    getAuditLogs,
    bulkSendReminders,
    bulkPauseReminders,
    bulkDeleteReminders,
    bulkRescheduleReminders
} from "../controller/reminder.controller.js";
import { isAuthenticated } from "../middleware/authMiddleware.js";

const router = express.Router();

// Protect all reminder routes
router.use(isAuthenticated);


//logged in user all reminders
router.get("/audit-logs/:mobile", getAuditLogs);
router.get("/", getAllReminders);
router.post("/send-now", sendWhatsappReminder);
router.post("/schedule", scheduleWhatsappReminder);

// Bulk Actions
router.post("/bulk/send-now", bulkSendReminders);
router.post("/bulk/pause", bulkPauseReminders);
router.post("/bulk/delete", bulkDeleteReminders);
router.post("/bulk/reschedule", bulkRescheduleReminders);

router.delete("/:reminderId", deleteReminder);
router.put("/reschedule/:reminderId", rescheduleReminder);

router.get("/:customerId", getCustomerReminderHistory);

export default router;