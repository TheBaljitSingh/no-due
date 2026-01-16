import axios from "axios";
import dotenv from 'dotenv';
import fs from "fs"
if (fs.existsSync('.env.development.local')) {
  dotenv.config({ path: '.env.development.local' });
} else {
  dotenv.config();
};

class WhatsAppService {
  constructor() {
    console.log(`Env is loaded in whatsappService env ${process.env.NODE_ENV} .`);

    this.apiUrl = process.env.WHATSAPP_API_URL;

    this.accessToken = process.env.ACCESS_TOKEN;

    this.headers = {
      headers: {
        "Authorization": `Bearer ${this.accessToken}`,
        "Content-Type": "application/json",
      },
    }

    if (!this.accessToken) {
      console.warn("WHATSAPP ACCESS TOKEN not set");
    }
    if (!this.headers) {
      console.warn("header is not there");
    }
  }


  async sendTemplateMessage({
    to,
    templateName,
    variables = [],
  }) {
    if (!to) {
      throw new Error("Recipient mobile number is required");
    }

    if (!templateName) {
      throw new Error("WhatsApp template name is required");
    }

    const payload = {
      messaging_product: "whatsapp",
      to,
      type: "template",
      template: {
        name: templateName,
        language: { code: "en_US" }, // defaulting to en_US for now
        components: [
          {
            type: "body",
            parameters: variables.map((value) => ({
              type: "text",
              text: String(value),
            })),
          },
        ],
      },
    };

    try {
      const response = await axios.post(this.apiUrl, payload, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "Content-Type": "application/json",
        },
        timeout: 10000,
      });

      return {
        success: true,
        providerResponse: response.data,
      };
    } catch (error) {
      //timeout error will come here
      console.error("WhatsApp send failed");
      console.error(error?.response?.data || error.message);

      throw new Error(
        error?.response?.data?.error?.message ||
        "Failed to send WhatsApp message"
      );
    }
  }
  async sendInteractiveMessage({ to, type, body, action, footer }) {
    if (!to) throw new Error("Recipient mobile number is required");
    if (!type || !["list", "button"].includes(type)) {
      throw new Error("Invalid interactive message type");
    }

    // Ensure body is correctly formatted as { text: "content" }
    let bodyObj;
    if (typeof body === 'string') {
      bodyObj = { text: body };
    } else if (body && body.text && typeof body.text === 'string') {
      bodyObj = { text: body.text };
    } else {
      throw new Error("Invalid body format. Must be a string or object with text property.");
    }

    const interactivePayload = {
      type: type,
      body: bodyObj,
      action: action,
    };

    if (footer) {
      interactivePayload.footer = { text: footer };
    }

    const payload = {
      messaging_product: "whatsapp",
      to,
      recipient_type: "individual",
      type: "interactive",
      interactive: interactivePayload,
    };

    try {
      console.log("sending interactive payload:", JSON.stringify(payload, null, 2));
      const response = await axios.post(this.apiUrl, payload, this.headers);
      return { success: true, data: response?.data };
    } catch (error) {
      console.error("WhatsApp interactive send failed:", error?.response?.data || error.message);
      throw new Error("Failed to send interactive message");
    }
  }

  async sendTextMessage({ to, text }) {

    const payload = {
      messaging_product: "whatsapp",
      to,
      recipient_type: "individual",
      type: "text",
      text: {
        body: text
      }
    };
    try {

      const response = await axios.post(this.apiUrl, payload, this.headers);
      return { success: true, data: response?.data };

    } catch (error) {
      console.log(error.response);
      throw new Error("Failed to send Text message");
    }
  }

}

export default new WhatsAppService();
