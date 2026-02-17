import express from 'express';
import { registerUser, updateUser, updatePassword, getAllTransaction } from '../controller/user.controller.js';

const router = express.Router();

router.post('/', registerUser);
router.put('/', updateUser);
router.put('/password', updatePassword);
//list all the  transaction to thair customers
router.get("/all-transactions", getAllTransaction);

export default router;