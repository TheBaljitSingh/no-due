import axios from "axios";
import { APIResponse } from "../utils/ResponseAndError/ApiResponse.utils.js";
import {APIError} from "../utils/ResponseAndError/ApiError.utils.js"
import whatsappMessage from "../model/whatsappMessage.modal.js"
import whatsappConversation from "../model/whatsappConversation.js";
import User from "../model/user.model.js";

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
    const META_URL = `https://graph.facebook.com/v23.0/927548713781362/messages`;

    const response = await axios.post(META_URL, payload, {
      headers: {
        Authorization: `Bearer ${process.env.ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      timeout: 5000,
    });

    // console.log("meta respnse", response);

    if(response.status===200){
      
      
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


export const getChatHistory = async (req, res)=>{
  try {
    const {mobile} = req.query;
  
    const response = await whatsappMessage.find({mobile});
    // console.log(response);
  
    return new APIResponse(200, response, "fetched", true).send(res);
    
  } catch (error) {
    console.log(error);

    return new APIError(500, error, "Failed to fetch chat history", false).send(res);

  }


}

export const getAllConversations = async (req, res)=>{
  //will return ongoing conversations
  try {
    const conversations = await whatsappConversation.find({}).sort({createdAt:-1}).populate({path:"customerId", select: "name mobile gender"}).limit(50);

    return new APIResponse(200, conversations, "fetched successfully", true).send(res);

  } catch (error) {
    console.log(error);
    return new APIError(500, error, "Failed to fetch conversations", false).send(res);
  }
}


export const connectWhatsApp = async (req, res) => {
  // if (!process.env.WHATSAPP_EMBEDDED_ENABLED) {
  //   return res.status(403).json({
  //     success: false,
  //     message: "WhatsApp Embedded Signup not enabled yet",
  //   });
  // }

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

    // 2️⃣ Get WhatsApp Business Accounts
// 2️⃣ Get businesses user manages
const businessRes = await axios.get(
  "https://graph.facebook.com/v19.0/me/businesses",
  {
    headers: { Authorization: `Bearer ${accessToken}` },
  }
);

const businessId = businessRes.data.data?.[0]?.id;
if (!businessId) throw new Error("No business found");

// 3️⃣ Get WABA from business
const wabaRes = await axios.get(
  `https://graph.facebook.com/v19.0/${businessId}/owned_whatsapp_business_accounts`,
  {
    headers: { Authorization: `Bearer ${accessToken}` },
  }
);

const wabaId = wabaRes.data.data?.[0]?.id;
if (!wabaId) throw new Error("No WABA found");


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
    return res.redirect(
      `${process.env.CLIENT_BASE_URL}/settings/whatsapp?connected=true`
    );
  } catch (err) {
    console.error("WhatsApp OAuth Error:", err.response?.data || err.message);
    return res.redirect(
      `${process.env.CLIENT_BASE_URL}/settings/whatsapp?connected=false`
    );
  }
};




