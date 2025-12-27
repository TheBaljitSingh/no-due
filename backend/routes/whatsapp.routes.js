import express from "express"; 
import {getChatHistory, sendReply} from "../controller/whatsapp.controller.js"

const router = express.Router();


router.post("/reply", sendReply);
router.get("/history", getChatHistory);

export default router;