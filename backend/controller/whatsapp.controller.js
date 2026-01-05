import axios from "axios";
import { APIResponse } from "../utils/ResponseAndError/ApiResponse.utils.js";
import {APIError} from "../utils/ResponseAndError/ApiError.utils.js"
import whatsappMessage from "../model/whatsappMessage.modal.js"
import whatsappConversation from "../model/whatsappConversation.js";

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
    const META_URL = `https://graph.facebook.com/v23.0/974705779052142/messages`;

    const response = await axios.post(META_URL, payload, {
      headers: {
        Authorization: `Bearer ${process.env.ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      timeout: 5000,
    });

    console.log("meta respnse", response);

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
    console.log(conversations);

    return new APIResponse(200, conversations, "fetched successfully", true).send(res);

  } catch (error) {
    console.log(error);
    return new APIError(500, error, "Failed to fetch conversations", false).send(res);
  }
}

