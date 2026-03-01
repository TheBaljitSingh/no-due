import express from "express";
import { isAuthenticated } from "../middleware/authMiddleware.js";
import {
  setup2FA,
  verifySetup2FA,
  disable2FA,
  regenerateBackupCodes,
  get2FAStatus,
} from "../controller/twofa.controller.js";

const router = express.Router();

// All routes require authentication
router.use(isAuthenticated);

router.post("/setup", setup2FA);
router.post("/verify-setup", verifySetup2FA);
router.post("/disable", disable2FA);
router.post("/backup-codes/regenerate", regenerateBackupCodes);
router.get("/status", get2FAStatus);

export default router;
