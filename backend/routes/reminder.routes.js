import express from "express";
import { getAllReminders, scheduleWhatsappReminder, sendWhatsappReminder, getCustomerReminderHistory, deleteReminder, rescheduleReminder, getAuditLogs } from "../controller/reminder.controller.js"
const router = express.Router();


//logged in user all reminders
router.get("/audit-logs/:mobile", getAuditLogs);
router.get("/", getAllReminders);
router.post("/send-now", sendWhatsappReminder); // now send while sync in my db
router.post("/schedule", scheduleWhatsappReminder); // later send by schedular
router.delete("/:reminderId", deleteReminder);
router.put("/reschedule/:reminderId", rescheduleReminder);

router.get("/:customerId", getCustomerReminderHistory);

export default router;