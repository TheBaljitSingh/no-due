import express from "express"
import {whatsappWebhook} from "../webhooks/whatsapp/whatsappwebhook.controller.js"
import dotenv from 'dotenv';
import fs from "fs";

if (fs.existsSync('.env.development.local')) {
  dotenv.config({ path: '.env.development.local' });
} else {
  dotenv.config();
};

const router = express.Router();

router.get("/", (req, res) => {
    const { 'hub.mode': mode, 'hub.challenge': challenge, 'hub.verify_token': token } = req.query;

    if (mode === 'subscribe' && token === process.env.VERIFY_TOKEN) {
        console.log('WEBHOOK VERIFIED');
        res.status(200).send(challenge);
    } else {
        res.status(403).end();
    }
});

router.post("/",(req, res)=>{
        
    res.sendStatus(200);

    // New Modular Webhook Handler
    whatsappWebhook(req.body).catch(err => console.error("New Webhook Handler failed:", err));
});

export default router;