import speakeasy from "speakeasy";
import QRCode from "qrcode";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import User from "../model/user.model.js";
import { APIResponse } from "../utils/ResponseAndError/ApiResponse.utils.js";
import { APIError } from "../utils/ResponseAndError/ApiError.utils.js";

const APP_NAME = "NoDue";

function generateBackupCodes(count = 8) {
  const codes = [];
  for (let i = 0; i < count; i++) {
    codes.push(crypto.randomBytes(5).toString("hex")); // 10 char hex codes
  }
  return codes;
}

async function hashBackupCodes(codes) {
  const hashed = await Promise.all(codes.map((code) => bcrypt.hash(code, 10)));
  return hashed;
}

// POST /v1/2fa/setup — Generate TOTP secret + QR code
export const setup2FA = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const user = await User.findById(userId).select("+twoFA.secret");

    if (!user) {
      return new APIError(404, ["User not found"]).send(res);
    }

    if (user.twoFA?.enabled) {
      return new APIError(400, [
        "Two-factor authentication is already enabled",
      ]).send(res);
    }

    const secret = speakeasy.generateSecret({
      name: `${APP_NAME} (${user.email})`,
      issuer: APP_NAME,
      length: 20,
    });

    // Store temp secret in session until verified
    req.session.tempTwoFASecret = secret.base32;

    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

    return new APIResponse(
      200,
      {
        qrCodeUrl,
        manualEntryKey: secret.base32,
      },
      "2FA setup initiated. Scan the QR code with your authenticator app.",
    ).send(res);
  } catch (error) {
    console.error("2FA setup error:", error);
    return new APIError(500, ["Failed to initiate 2FA setup"]).send(res);
  }
};

// POST /v1/2fa/verify-setup — Verify TOTP code and enable 2FA
export const verifySetup2FA = async (req, res) => {
  try {
    const { code } = req.body;
    const userId = req.user._id || req.user.id;

    if (!code || code.length !== 6) {
      return new APIError(400, ["Please enter a valid 6-digit code"]).send(res);
    }

    const tempSecret = req.session.tempTwoFASecret;
    if (!tempSecret) {
      return new APIError(400, [
        "No 2FA setup in progress. Please start setup again.",
      ]).send(res);
    }

    const isValid = speakeasy.totp.verify({
      secret: tempSecret,
      encoding: "base32",
      token: code,
      window: 1, // ±30s clock skew tolerance
    });

    if (!isValid) {
      return new APIError(401, [
        "Invalid verification code. Please try again.",
      ]).send(res);
    }

    // Generate backup codes
    const plainBackupCodes = generateBackupCodes(8);
    const hashedBackupCodes = await hashBackupCodes(plainBackupCodes);

    // Save secret and backup codes to DB
    await User.findByIdAndUpdate(userId, {
      "twoFA.enabled": true,
      "twoFA.secret": tempSecret,
      "twoFA.backupCodes": hashedBackupCodes,
      "twoFA.enabledAt": new Date(),
    });

    // Clear temp secret from session
    delete req.session.tempTwoFASecret;

    return new APIResponse(
      200,
      {
        backupCodes: plainBackupCodes,
      },
      "Two-factor authentication enabled successfully! Save your backup codes.",
    ).send(res);
  } catch (error) {
    console.error("2FA verify-setup error:", error);
    return new APIError(500, ["Failed to enable 2FA"]).send(res);
  }
};

// POST /v1/2fa/disable — Disable 2FA (requires password)
export const disable2FA = async (req, res) => {
  try {
    const { password } = req.body;
    const userId = req.user._id || req.user.id;

    if (!password) {
      return new APIError(400, ["Password is required to disable 2FA"]).send(
        res,
      );
    }

    const user = await User.findById(userId).select(
      "+password +twoFA.secret +twoFA.backupCodes",
    );

    if (!user) {
      return new APIError(404, ["User not found"]).send(res);
    }

    if (!user.twoFA?.enabled) {
      return new APIError(400, [
        "Two-factor authentication is not enabled",
      ]).send(res);
    }

    // Verify password (skip for Google OAuth users — they don't have a password)
    if (user.password) {
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        return new APIError(401, ["Incorrect password"]).send(res);
      }
    }

    // Clear all 2FA data
    await User.findByIdAndUpdate(userId, {
      "twoFA.enabled": false,
      $unset: {
        "twoFA.secret": "",
        "twoFA.backupCodes": "",
        "twoFA.enabledAt": "",
      },
    });

    return new APIResponse(
      200,
      {},
      "Two-factor authentication disabled successfully.",
    ).send(res);
  } catch (error) {
    console.error("2FA disable error:", error);
    return new APIError(500, ["Failed to disable 2FA"]).send(res);
  }
};

// POST /v1/2fa/backup-codes/regenerate — Regenerate backup codes
export const regenerateBackupCodes = async (req, res) => {
  try {
    const { password } = req.body;
    const userId = req.user._id || req.user.id;

    if (!password) {
      return new APIError(400, ["Password is required"]).send(res);
    }

    const user = await User.findById(userId).select("+password");

    if (!user) {
      return new APIError(404, ["User not found"]).send(res);
    }

    if (!user.twoFA?.enabled) {
      return new APIError(400, [
        "Two-factor authentication is not enabled",
      ]).send(res);
    }

    // Verify password
    if (user.password) {
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        return new APIError(401, ["Incorrect password"]).send(res);
      }
    }

    const plainBackupCodes = generateBackupCodes(8);
    const hashedBackupCodes = await hashBackupCodes(plainBackupCodes);

    await User.findByIdAndUpdate(userId, {
      "twoFA.backupCodes": hashedBackupCodes,
    });

    return new APIResponse(
      200,
      {
        backupCodes: plainBackupCodes,
      },
      "Backup codes regenerated. Save them securely.",
    ).send(res);
  } catch (error) {
    console.error("Backup codes regenerate error:", error);
    return new APIError(500, ["Failed to regenerate backup codes"]).send(res);
  }
};

// GET /v1/2fa/status — Get 2FA status for the logged-in user
export const get2FAStatus = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const user = await User.findById(userId).select("+twoFA.backupCodes");

    if (!user) {
      return new APIError(404, ["User not found"]).send(res);
    }

    return new APIResponse(
      200,
      {
        enabled: !!user.twoFA?.enabled,
        enabledAt: user.twoFA?.enabledAt || null,
        backupCodesRemaining: user.twoFA?.backupCodes?.length || 0,
      },
      "2FA status fetched",
    ).send(res);
  } catch (error) {
    console.error("2FA status error:", error);
    return new APIError(500, ["Failed to get 2FA status"]).send(res);
  }
};
