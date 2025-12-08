import exapress from 'express';
import { createCustomer, deleteCustomers, getCustomers, getCustomersById, updateCustomer } from '../controller/customer.controller.js';

const router = exapress.Router();


router.get("/", getCustomers); //get all customers
router.delete("/", deleteCustomers);
router.post("/", createCustomer);
router.get("/:customerId", getCustomersById);
router.put("/:customerId", updateCustomer);

export default router;