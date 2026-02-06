import express from 'express';
import { metaCallback, checkAuth, getGoogleProfile, googleLogin, googleLoginCallback, localLogin, logout, disconnectWhatsApp } from '../controller/auth.controller.js';

const router = express.Router();

router.get('/google-login', googleLogin);
router.get('/callback', googleLoginCallback);
router.get('/profile', getGoogleProfile);
router.get('/check-auth', checkAuth);
router.get('/logout', logout);
router.post('/login', localLogin);
router.get("/meta/callback", metaCallback);
router.post("/whatsapp/disconnect", disconnectWhatsApp);

export default router;