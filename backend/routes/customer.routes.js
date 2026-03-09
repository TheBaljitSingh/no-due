import express from "express";
import {
  createCustomer,
  deleteCustomers,
  getCustomers,
  getCustomersById,
  updateCustomer,
  validateBulkCustomers,
  bulkUploadSSE,
} from "../controller/customer.controller.js";
import {
  addDue,
  getTransactions,
  makePayment,
} from "../controller/customerTransaction.controller.js";
import { isAuthenticated } from "../middleware/authMiddleware.js";

const router = express.Router();

// Protect all customer routes
router.use(isAuthenticated);

router.get("/", getCustomers); //get all customers
// Specific POST sub-paths must come before the generic POST /
router.post("/validate-bulk", validateBulkCustomers);
router.post("/bulk-upload-sse", bulkUploadSSE);
router.post("/", createCustomer);
router.delete("/", deleteCustomers);
router.get("/:customerId", getCustomersById);
router.put("/:customerId", updateCustomer);

router.post("/:id/add-due", addDue);
router.post("/:id/add-payment", makePayment);
router.get("/:id/transactions", getTransactions);

export default router;
