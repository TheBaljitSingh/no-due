import express from 'express';
import { createPaymentTerm, deletePaymentTerm, getUserPaymentTerms, updatePaymentTerm } from '../controller/paymentTerm.controller.js';
import { isAuthenticated } from '../middleware/authMiddleware.js';

const router = express.Router();

// Protect all payment term routes
router.use(isAuthenticated);

// Define your payment term routes here
router.get('/', getUserPaymentTerms);
router.post('/', createPaymentTerm);
router.delete('/:id', deletePaymentTerm);
router.put('/:id', updatePaymentTerm);

export default router;