import passport from "../config/passport.config.js";
import { APIResponse } from "../utils/ResponseAndError/ApiResponse.utils.js";
import { APIError } from "../utils/ResponseAndError/ApiError.utils.js";
import axios from "axios";
import User from "../model/user.model.js";
import speakeasy from "speakeasy";
import bcrypt from "bcryptjs";

export const googleLogin = passport.authenticate("google", {
  scope: ["profile", "email"],
  session: true,
});

export const googleLoginCallback = (req, res, next) => {
  passport.authenticate("google", async (err, user, info) => {
    if (err) {
      return res.redirect(`${process.env.CLIENT_BASE_URL}`);
    }
    if (!user) {
      return res.redirect(`${process.env.CLIENT_BASE_URL}`);
    }

    // Check if user has 2FA enabled
    const fullUser = await User.findById(user._id || user.id);
    if (fullUser?.twoFA?.enabled) {
      // Store userId in session for 2FA verification, don't fully log in
      req.session.twoFAPending = String(fullUser._id);
      req.session.twoFAAttempts = 0;
      req.session.save(() => {
        return res.redirect(
          `${process.env.CLIENT_BASE_URL}/google-success?requires2fa=true`,
        );
      });
      return;
    }

    // No 2FA — log in normally
    req.login(user, (err) => {
      if (err) {
        return res.redirect(`${process.env.CLIENT_BASE_URL}`);
      }
      return res.redirect(`${process.env.CLIENT_BASE_URL}/google-success`);
    });
  })(req, res, next);
};

export const getGoogleProfile = (req, res) => {
  if (!req.user) return new APIError(401, ["unauthorized"]).send(res);
  return new APIResponse(
    200,
    { user: req.user },
    "Google profile fetched successfully",
  ).send(res);
};

export const checkAuth = async (req, res) => {
  if (req.user)
    return new APIResponse(200, { user: req.user }, "session found").send(res);
  return new APIError(401, ["No active session found", "Unauthorized"]).send(
    res,
  );
};

export const logout = (req, res) => {
  console.log(
    "Logging out user:",
    req.user ? req.user.id : "No user in request",
  );

  req.logout((err) => {
    if (err) {
      return new APIError(500, ["Logout failed"]).send(res);
    }

    req.session.destroy((err) => {
      if (err) {
        return new APIError(500, ["Session destruction failed"]).send(res);
      }

      // CLEAR COOKIE PROPERLY
      res.clearCookie("connect.sid", {
        path: "/", // REQUIRED
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "development" ? false : true,
      });

      console.log("Session + cookie cleared successfully");
      return new APIResponse(200, {}, "Logout successful").send(res);
    });
  });
};

const setMaxAge = (req, rememberMe) => {
  req.session.cookie.maxAge = rememberMe
    ? 7 * 24 * 60 * 60 * 1000 // 7 days
    : 24 * 60 * 60 * 1000; // 1 day
};

export const localLogin = (req, res) => {
  passport.authenticate("local", async (err, user, info) => {
    if (err) {
      return new APIError(500, ["Authentication failed", err.message]).send(
        res,
      );
    }
    if (!user) {
      console.log("info", info);
      return new APIError(401, ["Invalid Credentials"]).send(res);
    }

    // Check if user has 2FA enabled
    const fullUser = await User.findById(user._id || user.id);
    if (fullUser?.twoFA?.enabled) {
      // Don't fully log in — store pending state in session
      req.session.regenerate((err) => {
        if (err) {
          return new APIError(500, ["Session regeneration failed"]).send(res);
        }
        req.session.twoFAPending = String(fullUser._id);
        req.session.twoFAAttempts = 0;
        req.session.rememberMe = !!req.body.rememberMe;
        req.session.save((err) => {
          if (err) {
            return new APIError(500, ["Session save failed"]).send(res);
          }
          return new APIResponse(
            202,
            { requires2FA: true },
            "Two-factor authentication required",
          ).send(res);
        });
      });
      return;
    }

    // No 2FA — proceed with normal login
    const rememberMe = !!req.body.rememberMe;

    req.session.regenerate((err) => {
      if (err) {
        return new APIError(500, ["Session regeneration failed"]).send(res);
      }
      req.login(user, async (err) => {
        if (err) {
          return new APIError(500, ["Login failed"]).send(res);
        }
        setMaxAge(req, rememberMe);
        try {
          await new Promise((resolve, reject) => {
            req.session.save((err) => {
              if (err) return reject(err);
              resolve();
            });

            const id = String(user._id || user.id);
            return new APIResponse(
              200,
              { user: { id } },
              "Login successful",
            ).send(res);
          });
        } catch (err) {
          return new APIError(500, ["Session save failed"]).send(res);
        }
      });
    });
  })(req, res);
};

// POST /v1/auth/verify-2fa — Complete login after TOTP verification
export const verify2FALogin = async (req, res) => {
  try {
    const { code, isBackupCode } = req.body;
    const pendingUserId = req.session?.twoFAPending;

    if (!pendingUserId) {
      return new APIError(401, [
        "No pending 2FA verification. Please login again.",
      ]).send(res);
    }

    // Rate limiting: max 5 attempts
    const attempts = (req.session.twoFAAttempts || 0) + 1;
    req.session.twoFAAttempts = attempts;

    if (attempts > 5) {
      req.session.destroy(() => {});
      return new APIError(429, [
        "Too many failed attempts. Please login again.",
      ]).send(res);
    }

    if (!code) {
      return new APIError(400, ["Verification code is required"]).send(res);
    }

    const user = await User.findById(pendingUserId).select(
      "+twoFA.secret +twoFA.backupCodes +password",
    );
    if (!user) {
      req.session.destroy(() => {});
      return new APIError(404, ["User not found"]).send(res);
    }

    let isValid = false;

    if (isBackupCode) {
      // Check against backup codes
      const backupCodes = user.twoFA?.backupCodes || [];
      let matchedIndex = -1;

      for (let i = 0; i < backupCodes.length; i++) {
        const match = await bcrypt.compare(code, backupCodes[i]);
        if (match) {
          matchedIndex = i;
          isValid = true;
          break;
        }
      }

      if (isValid && matchedIndex >= 0) {
        // Remove the used backup code
        backupCodes.splice(matchedIndex, 1);
        await User.findByIdAndUpdate(pendingUserId, {
          "twoFA.backupCodes": backupCodes,
        });
      }
    } else {
      // Verify TOTP code
      isValid = speakeasy.totp.verify({
        secret: user.twoFA.secret,
        encoding: "base32",
        token: code,
        window: 1,
      });
    }

    if (!isValid) {
      const remaining = 5 - attempts;
      return new APIError(401, [
        `Invalid code. ${remaining} attempt${remaining !== 1 ? "s" : ""} remaining.`,
      ]).send(res);
    }

    // 2FA verified — complete the login
    const rememberMe = !!req.session.rememberMe;

    req.login(user, (err) => {
      if (err) {
        return new APIError(500, ["Login failed"]).send(res);
      }

      // Clean up 2FA pending state
      delete req.session.twoFAPending;
      delete req.session.twoFAAttempts;
      delete req.session.rememberMe;

      setMaxAge(req, rememberMe);

      req.session.save((err) => {
        if (err) {
          return new APIError(500, ["Session save failed"]).send(res);
        }
        const id = String(user._id || user.id);
        return new APIResponse(200, { user: { id } }, "Login successful").send(
          res,
        );
      });
    });
  } catch (error) {
    console.error("2FA verify login error:", error);
    return new APIError(500, ["Verification failed"]).send(res);
  }
};

export const metaCallback = async (req, res) => {
  const { code, state } = req.body || req.query; // Support both POST and GET

  if (!code || !state) {
    console.log("code", code);
    console.log("state", state);
    return res.status(400).send("Invalid OAuth callback");
  }

  try {
    // 1️⃣ Exchange code → access token
    const tokenRes = await axios.get(
      "https://graph.facebook.com/v24.0/oauth/access_token",
      {
        params: {
          client_id: process.env.META_APP_ID,
          client_secret: process.env.META_APP_SECRET,
          redirect_uri: "", //meta bug
          code,
        },
      },
    );

    const shortLivedToken = tokenRes.data.access_token;

    const longLivedTokenRes = await axios.get(
      "https://graph.facebook.com/v24.0/oauth/access_token",
      {
        params: {
          grant_type: "fb_exchange_token",
          client_id: process.env.META_APP_ID,
          client_secret: process.env.META_APP_SECRET,
          fb_exchange_token: shortLivedToken,
        },
      },
    );
    const accessToken = longLivedTokenRes.data.access_token; //this is access token

    // 2️⃣ Get WhatsApp Business Accounts
    const wabaRes = await axios.get(
      "https://graph.facebook.com/v24.0/me/assigned_whatsapp_business_accounts",
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );

    console.log("WABA Response:", wabaRes.data);

    const wabaId = wabaRes.data.data?.[0]?.id;
    if (!wabaId) throw new Error("No WhatsApp Business Account found");

    // 3️⃣ Get phone numbers
    const phoneRes = await axios.get(
      `https://graph.facebook.com/v24.0/${wabaId}/phone_numbers`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );

    const phoneNumberId = phoneRes.data.data?.[0]?.id;
    if (!phoneNumberId) throw new Error("No phone number found");

    // 4️⃣ Save to DB // state is userId
    await User.findByIdAndUpdate(state, {
      whatsapp: {
        status: "connected",
        provider: "meta",
        wabaId,
        phoneNumberId,
        accessToken,
      },
    });

    return res.redirect(
      `${process.env.CLIENT_BASE_URL}/nodue/settings/whatsapp?connected=true`,
    );
  } catch (err) {
    console.error("WhatsApp OAuth Error:", err.response?.data || err.message);

    const errorMessage =
      err.response?.data?.error?.message ||
      err.message ||
      "Unknown error occurred";

    // Return JSON for POST, redirect for GET
    if (req.method === "POST") {
      return res.status(500).json({
        success: false,
        message: "Failed to connect WhatsApp",
        error: errorMessage,
      });
    }

    // Encode error message for URL
    const encodedError = encodeURIComponent(errorMessage);
    return res.redirect(
      `${process.env.CLIENT_BASE_URL}/nodue/settings/whatsapp?connected=false&error=${encodedError}`,
    );
  }
};

export const disconnectWhatsApp = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return new APIError(401, ["Unauthorized"]).send(res);
    }

    const userId = req.user.id;

    // Clear WhatsApp credentials from user document
    await User.findByIdAndUpdate(userId, {
      $unset: { whatsapp: "" },
    });

    return new APIResponse(200, {}, "WhatsApp disconnected successfully").send(
      res,
    );
  } catch (error) {
    console.error("WhatsApp disconnect error:", error);
    return new APIError(500, [
      "Failed to disconnect WhatsApp",
      error.message,
    ]).send(res);
  }
};
