import passport from "../utils/passportSetup/passportSetup.js";
import { APIResponse } from "../utils/ResponseAndError/ApiResponse.utils.js";
import { APIError } from "../utils/ResponseAndError/ApiError.utils.js";
import axios from "axios";
import User from "../model/user.model.js";

export const googleLogin = passport.authenticate('google', {
  scope: ['profile', 'email'],
  session: true,
});

export const googleLoginCallback = passport.authenticate('google', {
  successRedirect: `${process.env.CLIENT_BASE_URL}/google-success`,
  failureRedirect: `${process.env.CLIENT_BASE_URL}`,
  session: true,
});

export const getGoogleProfile = (req, res) => {
  if (!req.user) return new APIError(401, ['unauthorized']).send(res);
  return new APIResponse(200, { user: req.user }, 'Google profile fetched successfully').send(res);
};

export const checkAuth = async (req, res) => {
  if (req.user)
    return new APIResponse(200, { user: req.user }, 'session found').send(res);
  return new APIError(401, ['No active session found', 'Unauthorized']).send(res);
};

export const logout = (req, res) => {
  console.log("Logging out user:", req.user ? req.user.id : "No user in request");

  req.logout(err => {
    if (err) {
      return new APIError(500, ["Logout failed"]).send(res);
    }

    req.session.destroy(err => {
      if (err) {
        return new APIError(500, ["Session destruction failed"]).send(res);
      }

      // CLEAR COOKIE PROPERLY
      res.clearCookie("connect.sid", {
        path: "/",           // REQUIRED
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === 'development' ? false : true,
      });

      console.log("Session + cookie cleared successfully");
      return new APIResponse(200, {}, "Logout successful").send(res);
    });
  });
};


const setMaxAge = (req, rememberMe) => {
  req.session.cookie.maxAge = rememberMe
    ? 7 * 24 * 60 * 60 * 1000 // 7 days
    : 24 * 60 * 60 * 1000;    // 1 day
};

export const localLogin = (req, res) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) {
      return new APIError(500, ['Authentication failed', err.message]).send(res);
    }
    if (!user) {
      return new APIError(401, [info?.message || 'User Not Found']).send(res);
    }
    const rememberMe = !!req.body.rememberMe;
    const lastLogin = Date.now();

    req.session.regenerate((err) => {
      if (err) {
        return new APIError(500, ['Session regeneration failed']).send(res);
      }
      req.login(user, async (err) => {
        if (err) {
          return new APIError(500, ['Login failed']).send(res);
        }
        setMaxAge(req, rememberMe);
        try {
          await new Promise((resolve, reject) => {
            req.session.save((err) => {
              if (err) return reject(err);
              resolve();
            });
            const currenySid = req.sessionID;
            //to update the last login time, and destroy the other sessions
            //call this 

            const id = String(user._id || user.id);
            return new APIResponse(200, { user: { id } }, 'Login successful').send(res);
          });

        } catch (err) {
          return new APIError(500, ['Session save failed']).send(res);
        }
      });
    });
  })(req, res);
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
          redirect_uri: '', //meta bug
          code,
        },
      }
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
      }
    );
    const accessToken = longLivedTokenRes.data.access_token; //this is access token

    // 2️⃣ Get WhatsApp Business Accounts
    const wabaRes = await axios.get(
      "https://graph.facebook.com/v24.0/me/assigned_whatsapp_business_accounts",
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    console.log("WABA Response:", wabaRes.data);

    const wabaId = wabaRes.data.data?.[0]?.id;
    if (!wabaId) throw new Error("No WhatsApp Business Account found");


    // 3️⃣ Get phone numbers
    const phoneRes = await axios.get(
      `https://graph.facebook.com/v24.0/${wabaId}/phone_numbers`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
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
      `${process.env.CLIENT_BASE_URL}/nodue/settings/whatsapp?connected=true`
    );


  } catch (err) {
    console.error("WhatsApp OAuth Error:", err.response?.data || err.message);

    const errorMessage = err.response?.data?.error?.message || err.message || "Unknown error occurred";

    // Return JSON for POST, redirect for GET
    if (req.method === 'POST') {
      return res.status(500).json({
        success: false,
        message: "Failed to connect WhatsApp",
        error: errorMessage
      });
    }

    // Encode error message for URL
    const encodedError = encodeURIComponent(errorMessage);
    return res.redirect(
      `${process.env.CLIENT_BASE_URL}/nodue/settings/whatsapp?connected=false&error=${encodedError}`
    );
  }
}

export const disconnectWhatsApp = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return new APIError(401, ['Unauthorized']).send(res);
    }

    const userId = req.user.id;

    // Clear WhatsApp credentials from user document
    await User.findByIdAndUpdate(userId, {
      $unset: { whatsapp: "" }
    });

    return new APIResponse(200, {}, 'WhatsApp disconnected successfully').send(res);
  } catch (error) {
    console.error('WhatsApp disconnect error:', error);
    return new APIError(500, ['Failed to disconnect WhatsApp', error.message]).send(res);
  }
};
