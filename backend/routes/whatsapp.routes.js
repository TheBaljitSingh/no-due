import express from "express";
import { getChatHistory, sendReply, getAllConversations, connectWhatsApp, whatsappOAuthCallback, onboardBusiness, registerTemplate, getTemplates, manualConnect, getTemplateConfig, saveTemplateConfig } from "../controller/whatsapp.controller.js"
import { isAuthenticated } from "../middleware/authMiddleware.js";

const router = express.Router();

// OAuth routes (no authentication required for callback)
// router.get("/oauth/connect", isAuthenticated, connectWhatsApp);
// router.get("/oauth/callback", whatsappOAuthCallback);

// All other routes require authentication
router.use(isAuthenticated);

// Embedded Signup Onboarding
router.post("/onboard", onboardBusiness);
router.post("/manual-connect", manualConnect);

// Template Management
router.post("/templates", registerTemplate);
router.get("/templates", getTemplates);

// Template Configuration
router.get("/template-config", getTemplateConfig);
router.post("/template-config", saveTemplateConfig);

router.post("/reply", sendReply);
router.get("/history", getChatHistory);
router.get("/conversations", getAllConversations); //it will return the all onging conversations 

export default router;