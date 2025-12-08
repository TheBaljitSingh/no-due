import express from 'express';
import { checkAuth, geGoogleProfile, googleLogin, googleLoginCallback, localLogin, logout } from '../controller/auth.controller';

const router = express.Router();

router.get('/google-login',googleLogin);
router.get('/google-callback',googleLoginCallback);
router.get('/profile',geGoogleProfile);
router.get('/check-auth',checkAuth);
router.get('/logout',logout);
router.post('/login',localLogin);

export default router;