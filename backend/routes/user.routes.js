import express from 'express';
import { registerUser, updateUser, updatePassword } from '../controller/user.controller.js';

const router = express.Router();

router.post('/', registerUser);
router.put('/', updateUser);
router.put('/password', updatePassword);

export default router;