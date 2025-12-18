import axios from "axios";

class WhatsAppService {
  constructor() {
    this.apiUrl =
      process.env.WHATSAPP_API_URL ||
      "https://graph.facebook.com/v23.0/974705779052142/messages";

    this.accessToken = process.env.ACCESS_TOKEN;

    if (!this.accessToken) {
      console.warn(" WHATSAPP ACCESS TOKEN not set");
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
}

export default new WhatsAppService();
