import { APIResponse } from "../utils/ResponseAndError/ApiResponse.utils.js";
import { APIError } from "../utils/ResponseAndError/ApiError.utils.js"
import whatsappMessage from "../model/whatsappMessage.modal.js"
import whatsappConversation from "../model/whatsappConversation.js";
import User from "../model/user.model.js";
import whatsappService from "../services/whatsapp.service.js";
import axios from "axios";

export const sendReply = async (req, res) => {
  const { to, context, text } = req.body;

  if (!to) {
    return res.status(400).json({ error: "Recipient 'to' is required" });
  }

  if (!text) {
    return res.status(400).json({ error: "Reply text is required" });
  }

  if (context && !context.message_id) {
    return res.status(400).json({
      error: "context.message_id is required for reply",
    });
  }

  const messageDoc = await whatsappMessage.create({
    direction: "OUTBOUND",
    customerId: to,
    mobile: to,
    text,
    status: "queued",
    timestamp: new Date(),
  });

  const payload = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to,
    type: "text",
    text: { body: text },
    ...(context?.message_id && {
      context: { message_id: context.message_id },
    }),
  };

  try {
    const user = req.user;
    if (!user || !user.whatsapp || user.whatsapp.status !== 'connected') {
      return new APIError(403, null, "WhatsApp not connected", false).send(res);
    }

    const { phoneNumberId, accessToken } = user.whatsapp;
    const META_URL = `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`;

    const response = await axios.post(META_URL, payload, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      timeout: 5000,
    });

    // console.log("meta respnse", response);

    if (response.status === 200) {


      await whatsappMessage.findByIdAndUpdate(messageDoc._id, {
        status: "sent",
        whatsappMessageId: response.data.messages?.[0]?.id,
      });

      return new APIResponse(
        200,
        response.data,
        "Message sent successfully",
        true
      ).send(res);
    }

    return new APIResponse(
      200,
      response.data,
      "Message in queue",
      true
    ).send(res);

  } catch (error) {
    console.error("WhatsApp send failed:", error?.response?.data || error.message || error);

    await whatsappMessage.findByIdAndUpdate(messageDoc._id, {
      status: "failed",
      errorReason: error?.response?.data || error.message,
    });

    return new APIError(
      500,
      error,
      "Message sending failed",
      false
    ).send(res);
  }
};


export const getChatHistory = async (req, res) => {
  try {
    const { mobile } = req.query;

    const response = await whatsappMessage.find({ mobile });
    // console.log(response);

    return new APIResponse(200, response, "fetched", true).send(res);

  } catch (error) {
    console.log(error);

    return new APIError(500, error, "Failed to fetch chat history", false).send(res);

  }


}

export const getAllConversations = async (req, res) => {
  //will return ongoing conversations
  try {
    const conversations = await whatsappConversation.find({}).sort({ createdAt: -1 }).populate({ path: "customerId", select: "name mobile gender" }).limit(50);

    return new APIResponse(200, conversations, "fetched successfully", true).send(res);

  } catch (error) {
    console.log(error);
    return new APIError(500, error, "Failed to fetch conversations", false).send(res);
  }
}

export const connectWhatsApp = async (req, res) => {
  const redirectUri = `${process.env.API_BASE_URL}/api/v1/whatsapp/oauth/callback`;

  const url =
    `https://www.facebook.com/v19.0/dialog/oauth` +
    `?client_id=${process.env.META_APP_ID}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&state=${req.user._id}` +
    `&scope=whatsapp_business_management,whatsapp_business_messaging`;

  return new APIResponse(200, { url }, "WhatsApp OAuth URL", true).send(res);
};

export const whatsappOAuthCallback = async (req, res) => {
  const { code, state } = req.query; // state = userId

  if (!code || !state) {
    return res.status(400).send("Invalid OAuth callback");
  }

  try {
    // 1️⃣ Exchange code → access token
    const tokenRes = await axios.get(
      "https://graph.facebook.com/v19.0/oauth/access_token",
      {
        params: {
          client_id: process.env.META_APP_ID,
          client_secret: process.env.META_APP_SECRET,
          redirect_uri: `${process.env.API_BASE_URL}/api/v1/whatsapp/oauth/callback`,
          code,
        },
      }
    );

    const accessToken = tokenRes.data.access_token;

    // 2️⃣ Get assigned WhatsApp Business Accounts directly
    const wabaRes = await axios.get(
      "https://graph.facebook.com/v19.0/me/assigned_whatsapp_business_accounts",
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    const wabaId = wabaRes.data.data?.[0]?.id;
    if (!wabaId) throw new Error("No WhatsApp Business Account found");

    // 3️⃣ Get phone numbers
    const phoneRes = await axios.get(
      `https://graph.facebook.com/v19.0/${wabaId}/phone_numbers`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    const phoneNumberId = phoneRes.data.data?.[0]?.id;
    if (!phoneNumberId) throw new Error("No phone number found");

    // 4️⃣ Save to DB
    await User.findByIdAndUpdate(state, {
      whatsapp: {
        status: "connected",
        provider: "meta",
        wabaId,
        phoneNumberId,
        accessToken,
      },
    });

    // 5️⃣ Redirect back to app
    // return res.redirect(
    //   `${process.env.CLIENT_BASE_URL}/settings/whatsapp?connected=true`
    // );
  } catch (err) {
    console.error("WhatsApp OAuth Error:", err.response?.data || err.message);
    // return res.redirect(
    //   `${process.env.CLIENT_BASE_URL}/settings/whatsapp?connected=false`
    // );
  }
};

export const onboardBusiness = async (req, res) => {
  try {
    const { code, setupInfo, accessToken: shortLivedToken } = req.body;
    const userId = req.user._id;

    let accessToken;

    // 1. Exchange code/token for Long-Lived Token
    if (code) {
      const tokenData = await whatsappService.exchangeCodeForToken(code);
      console.log("printing the tokenData", tokenData);
      accessToken = tokenData.access_token;
    } else if (shortLivedToken) {
      const tokenData = await whatsappService.extendAccessToken(shortLivedToken);
      accessToken = tokenData.access_token;
    } else {
      throw new Error("No code or access token provided for onboarding.");
    }

    // 2. Fetch Business Profile & WABA (The setupInfo from frontend might contain some IDs, but verifying via API is safer)
    // If the frontend provides the WABA ID, we can use it to verify ownership
    // For simplicity, we'll fetch the WABA we have access to
    const businesses = await whatsappService.getBusinessProfile(accessToken);
    // This part can be complex as a user might have multiple businesses.
    // For the MVP, we assume the first WABA found in the connected business is the target.
    // Ideally, we iterate to find the one matching setupInfo if provided.

    // Let's assume we find the right business ID from the token
    const businessId = businesses.businesses?.data?.[0]?.id;

    if (!businessId) {
      throw new Error("No business account found associated with this user.");
    }

    const waba = await whatsappService.getWABA(accessToken, businessId);
    if (!waba) {
      throw new Error("No WhatsApp Business Account found.");
    }

    console.log("printing waba id ", waba);

    const phoneNumbers = await whatsappService.getPhoneNumbers(accessToken, waba.id);
    if (!phoneNumbers || phoneNumbers.length === 0) {
      throw new Error("No phone numbers found in this WABA.");
    }

    const phoneNumberId = phoneNumbers[0].id; // Taking the first one for now

    // 3. Subscribe to Webhooks
    await whatsappService.subscribeToWebhooks(accessToken, waba.id);

    // 4. Update User
    await User.findByIdAndUpdate(userId, {
      whatsapp: {
        status: 'connected',
        setupStatus: 'COMPLETED',
        provider: 'meta',
        wabaId: waba.id,
        phoneNumberId: phoneNumberId,
        accessToken: accessToken,
        businessProfileId: businessId,
        // store other info if needed
      }
    });

    return new APIResponse(200, { wabaId: waba.id, phoneNumberId }, "WhatsApp Business Connected Successfully", true).send(res);

  } catch (error) {
    console.error("Onboarding Error:", error);
    return new APIError(500, error, "Failed to onboard business", false).send(res);
  }
};

export const manualConnect = async (req, res) => {
  try {
    console.log("manaul connect\n");
    const { wabaId, phoneNumberId, accessToken } = req.body;
    console.log(req);
    const userId = req.user._id;

    if (!wabaId || !phoneNumberId || !accessToken) {
      return new APIError(400, null, "All fields are required", false).send(res);
    }

    // 1. Verify Credentials with Meta
    try {
      // Validate WABA
      const wabaData = await whatsappService.getWABA(accessToken, wabaId);
      if (!wabaData || wabaData.id !== wabaId) {
        throw new Error("Invalid WABA ID or Access Token");
      }

      // Validate Phone Number
      // We can just fetch phone numbers and check if the provided one exists in the list
      const phoneNumbers = await whatsappService.getPhoneNumbers(accessToken, wabaId);
      const phoneExists = phoneNumbers.find(p => p.id === phoneNumberId);

      if (!phoneExists) {
        throw new Error("Phone Number ID does not belong to this WABA");
      }

    } catch (validationError) {
      console.error("Credential Validation Failed:", validationError);
      return new APIError(400, validationError, "Invalid Credentials: Could not verify with Meta. Please check your IDs and Token.", false).send(res);
    }

    // 2. Save to DB
    await User.findByIdAndUpdate(userId, {
      whatsapp: {
        status: 'connected',
        setupStatus: 'COMPLETED',
        provider: 'manual',
        wabaId,
        phoneNumberId,
        accessToken,
      }
    });

    return new APIResponse(200, { wabaId, phoneNumberId }, "Connected Successfully (Manual)", true).send(res);

  } catch (error) {
    console.error("Manual Connect Error:", error);
    return new APIError(500, error, "Failed to connect", false).send(res);
  }
};

export const registerTemplate = async (req, res) => {
  try {
    const { name, category, components, language } = req.body;
    const user = req.user;

    if (!user?.whatsapp?.accessToken || !user?.whatsapp?.wabaId) {
      return new APIError(403, null, "WhatsApp not connected", false).send(res);
    }

    const templateData = {
      name,
      category,
      components,
      language: language || 'en_US',
    };

    const response = await whatsappService.createTemplate(user.whatsapp.accessToken, user.whatsapp.wabaId, templateData);
    return new APIResponse(201, response, "Template created successfully", true).send(res);

  } catch (error) {
    console.error("Template Registration Error:", error);
    return new APIError(500, error, "Failed to create template", false).send(res);
  }
};

export const getTemplates = async (req, res) => {
  try {
    const user = req.user;
    if (!user?.whatsapp?.accessToken || !user?.whatsapp?.wabaId) {
      return new APIError(403, null, "WhatsApp not connected", false).send(res);
    }

    const response = await whatsappService.getTemplates(user.whatsapp.accessToken, user.whatsapp.wabaId);
    return new APIResponse(200, response, "Templates fetched successfully", true).send(res);

  } catch (error) {
    console.error("Get Templates Error:", error);
    return new APIError(500, error, "Failed to fetch templates", false).send(res);
  }
};

// Get Template Configuration
export const getTemplateConfig = async (req, res) => {
  try {
    const user = req.user;

    const config = user?.whatsapp?.reminderTemplates || {
      beforeDue: '',
      dueToday: '',
      overdue: ''
    };

    return new APIResponse(200, config, "Template configuration fetched successfully", true).send(res);
  } catch (error) {
    console.error("Get Template Config Error:", error);
    return new APIError(500, error, "Failed to fetch template configuration", false).send(res);
  }
};

// Save Template Configuration
export const saveTemplateConfig = async (req, res) => {
  try {
    const user = req.user;
    const { beforeDue, dueToday, overdue } = req.body;

    if (!user) {
      return new APIError(401, null, "User not authenticated", false).send(res);
    }

    // Update user's template configuration
    await User.findByIdAndUpdate(user._id, {
      'whatsapp.reminderTemplates': {
        beforeDue: beforeDue || '',
        dueToday: dueToday || '',
        overdue: overdue || ''
      }
    });

    return new APIResponse(200, { beforeDue, dueToday, overdue }, "Template configuration saved successfully", true).send(res);
  } catch (error) {
    console.error("Save Template Config Error:", error);
    return new APIError(500, error, "Failed to save template configuration", false).send(res);
  }
};


