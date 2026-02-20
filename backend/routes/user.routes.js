import express from 'express';
import { registerUser, updateUser, updatePassword, getAllTransaction } from '../controller/user.controller.js';
import { isAuthenticated } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public: registration doesn't need auth
router.post('/', registerUser);

// All remaining user routes require an active session
router.use(isAuthenticated);

router.put('/', updateUser);
router.put('/password', updatePassword);
// List all transactions belonging to the logged-in user's customers
router.get('/all-transactions', getAllTransaction);

export default router;
