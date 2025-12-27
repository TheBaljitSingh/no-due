import axios from "axios";
import { APIResponse } from "../utils/ResponseAndError/ApiResponse.utils.js";
import {APIError} from "../utils/ResponseAndError/ApiError.utils.js"
import whatsappMessage from "../model/whatsapp.modal.js"

export const sendReply = async (req, res) => {
  try {
    const { to, context, text } = req.body;

    if (!to) {
      return res.status(400).json({ error: "Recipient 'to' is required" });
    }

    if (!text) {
      return res.status(400).json({ error: "Reply text is required" });
    }

    // context.message_id is OPTIONAL
    // but REQUIRED if you want to reply to a specific message
    if (context && !context.message_id) {
      return res
        .status(400)
        .json({ error: "context.message_id is required for reply" });
    }

    const META_URL = `https://graph.facebook.com/v23.0/974705779052142/messages`;

    const payload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "text",
      text: {
        body: text,
      },
    };

    if (context?.message_id) {
      payload.context = {
        message_id: context.message_id,
      };
    }

    const response = await axios.post(META_URL, payload, {
      headers: {
        Authorization: `Bearer ${process.env.ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
    });
    console.log("meta response",response.data.messages[0].id);

    // also have to save it in the db
   try {
     await whatsappMessage.create({
       direction:"OUTBOUND",
       customerId:to,
       phone: to,
       text:text,
       whatsappMessageId:response.data.messages[0].id,
       timestamp:new Date()
     })
 
   } catch (error) {
    console.log(error);
   }
    return new APIResponse(200, "response.data", "Reply sent successfully",true).send(res);

   
  } catch (error) {
    console.error(
      "WhatsApp reply error:",
      error?.response?.data || error.message
    );

    return new APIError(500, error?.response?.data, "Failed to send reply", false).send(res);
   
  }
};

export const getChatHistory = async (req, res)=>{
  try {
    const {customerId} = req.query;
  
    const response = await whatsappMessage.find(customerId);
  
    return new APIResponse(200, response, "fetched", true).send(res);
    
  } catch (error) {
    console.log(error);

    return new APIError(500, error, "Failed to fetch chat history", false).send(res);

  }


}