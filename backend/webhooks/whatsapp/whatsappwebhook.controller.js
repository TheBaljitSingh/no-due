import { handleWhatsappEvent } from "./whatsapp.handler.js";

export const whatsappWebhook = async (payload) => {
  try {
    await handleWhatsappEvent(payload);
  } catch (err) {
    console.error("WhatsApp Webhook Error:", err);
  }
};
