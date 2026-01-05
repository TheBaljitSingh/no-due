import express from "express";
import {getAllRemainders, scheduleWhatsappRemainder, sendWhatsappRemainder, getCustomerReminderHistory} from "../controller/remainder.controller.js"
const router  = express.Router();


//logged in user all remainders
router.get("/", getAllRemainders);
router.post("/send-now", sendWhatsappRemainder); // now send while sync in my db
router.post("/schedule", scheduleWhatsappRemainder); // later send by schedular

router.get("/:customerId", getCustomerReminderHistory);

export default router;