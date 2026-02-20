import express from 'express';
import { createCustomer, deleteCustomers, getCustomers, getCustomersById, updateCustomer } from '../controller/customer.controller.js';
import { addDue, getTransactions, makePayment } from "../controller/customerTransaction.controller.js";
import { isAuthenticated } from '../middleware/authMiddleware.js';

const router = express.Router();

// Protect all customer routes
router.use(isAuthenticated);


router.get("/", getCustomers); //get all customers
router.post("/", createCustomer);
router.delete("/:customerId", deleteCustomers);
router.get("/:customerId", getCustomersById);
router.put("/:customerId", updateCustomer);

router.post("/:id/add-due", addDue);
router.post("/:id/add-payment", makePayment);
router.get("/:id/transactions", getTransactions);

export default router;