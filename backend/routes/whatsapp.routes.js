import express from "express"; 
import {getChatHistory, sendReply, getAllConversations} from "../controller/whatsapp.controller.js"

const router = express.Router();


router.post("/reply", sendReply);
router.get("/history", getChatHistory);
router.get("/conversations", getAllConversations); //it will return the all onging conversations 

export default router;