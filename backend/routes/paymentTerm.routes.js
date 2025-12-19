import express from 'express';
import { createPaymentTerm, deletePaymentTerm, getUserPaymentTerms, updatePaymentTerm } from '../controller/paymentTerm.controller';

const router = express.Router();

// Define your payment term routes here
router.get('/', getUserPaymentTerms);
router.post('/', createPaymentTerm);
router.delete('/:id', deletePaymentTerm);
router.put('/:id', updatePaymentTerm);

export default router;