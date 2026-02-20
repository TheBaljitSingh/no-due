import axios from 'axios';
import whatsappAuditService from './whatsapp.audit.service.js';
import Transaction from '../model/transaction.model.js';

class WhatsappService {
  constructor() {
    this.baseUrl = 'https://graph.facebook.com/v24.0';
  }

  async exchangeCodeForToken(code) {
    try {
      const response = await axios.get(`${this.baseUrl}/oauth/access_token`, {
        params: {
          client_id: process.env.META_APP_ID,
          client_secret: process.env.META_APP_SECRET,
          code: code,
          redirect_uri: `${process.env.META_REDIRECT_URI}/api/v1/whatsapp/oauth/callback` // Or the post-message callback URL
        }
      });
      return response.data; // { access_token, token_type, expires_in }
    } catch (error) {
      console.error('Error exchanging token:', error.response?.data || error.message);
      throw new Error('Failed to exchange code for token');
    }
  }

  async extendAccessToken(shortLivedToken) {
    try {
      const response = await axios.get(`${this.baseUrl}/oauth/access_token`, {
        params: {
          grant_type: 'fb_exchange_token',
          client_id: process.env.META_APP_ID,
          client_secret: process.env.META_APP_SECRET,
          fb_exchange_token: shortLivedToken
        }
      });
      return response.data; // { access_token, token_type, expires_in }
    } catch (error) {
      console.error('Error extending token:', error.response?.data || error.message);
      throw new Error('Failed to extend access token');
    }
  }

  async getBusinessProfile(accessToken) {
    try {
      // Get the user's business accounts
      const meResponse = await axios.get(`${this.baseUrl}/me`, {
        params: { fields: 'id,name,businesses' },
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      // Attempt to find the business connected/created during the specific flow
      // This logic might need adjustment based on what exactly Embedded Signup returns
      // Typically we look for the business that owns the WABA
      return meResponse.data;
    } catch (error) {
      console.error('Error fetching business profile:', error.response?.data || error.message);
      throw new Error('Failed to fetch business profile');
    }
  }

  async getWABA(accessToken, businessIdOrWabaId) {
    try {
      // If the ID looks like a WABA ID (just digits), we can try specific endpoints or just assume usage.
      // But typically we fetch owned_whatsapp_business_accounts from a Business ID.
      // For verification of a direct WABA ID, we can query the WABA node directly.

      const response = await axios.get(`${this.baseUrl}/${businessIdOrWabaId}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      // If we queried a Business ID for owned accounts:
      if (response.data.data) {
        return response.data.data[0];
      }

      // If we queried the WABA ID directly (it returns the object directly)
      return response.data;

    } catch (error) {
      console.error('Error fetching WABA:', error.response?.data || error.message);
      throw new Error('Failed to fetch WABA');
    }
  }

  async getPhoneNumbers(accessToken, wabaId) {
    try {
      const response = await axios.get(`${this.baseUrl}/${wabaId}/phone_numbers`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      return response.data.data;
    } catch (error) {
      console.error('Error fetching phone numbers:', error.response?.data || error.message);
      throw new Error('Failed to fetch phone numbers');
    }
  }

  // Register the tech provider's app to receive webhooks for this WABA
  async subscribeToWebhooks(accessToken, wabaId) {
    try {
      const response = await axios.post(`${this.baseUrl}/${wabaId}/subscribed_apps`, {}, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error subscribing to webhooks:', error.response?.data || error.message);
      // Don't throw here, just log, as it might already be subscribed or have permission issues
      return null;
    }
  }

  async getTemplates(accessToken, wabaId) {
    try {
      const response = await axios.get(`${this.baseUrl}/${wabaId}/message_templates`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching templates:', error.response?.data || error.message);
      throw new Error('Failed to fetch templates');
    }
  }

  async createTemplate(accessToken, wabaId, templateData) {
    try {
      const response = await axios.post(`${this.baseUrl}/${wabaId}/message_templates`, templateData, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error creating template:', error.response?.data || error.message);
      // Return the error details so controller can send it to frontend
      throw error.response?.data || new Error('Failed to create template');
    }
  }

  async sendTemplateMessage({ to, templateName, variables, language = 'en', accessToken, phoneNumberId }) {
    try {
      if (!accessToken || !phoneNumberId) {
        throw new Error("Missing WhatsApp credentials (accessToken or phoneNumberId)");
      }
      const payload = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: to,
        type: "template",
        template: {
          name: templateName,
          language: { code: language },
          components: [
            {
              type: "body",
              parameters: Object.entries(variables).map(([key, v]) => ({
                type: "text",
                text: String(v),
                parameter_name: key

              }))
            }
          ]
        }
      };

      const response = await axios.post(`${this.baseUrl}/${phoneNumberId}/messages`, payload, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        }
      });

      console.log(response);

      // Audit Log for Template Message
      await whatsappAuditService.logMessage({
        mobile: to,
        direction: "OUTBOUND",
        type: "template",
        templateName: templateName,
        text: `Template: ${templateName}`,
        whatsappMessageId: response.data.messages?.[0]?.id,
        status: "sent",
        variables: variables
      });

      return response.data;
    } catch (error) {
      console.error('Error sending template message:', error.response?.data || error.message);
      throw error.response?.data || new Error('Failed to send template message');
    }
  }


  async sendTextMessage({ to, text, accessToken, phoneNumberId }) {

    if (!accessToken || !phoneNumberId) {
      console.error("Missing WhatsApp credentials for sendTextMessage");
      throw new Error("Missing WhatsApp credentials");
    }

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

      const response = await axios.post(`${this.baseUrl}/${phoneNumberId}/messages`, payload, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        }
      });

      // Audit Log
      await whatsappAuditService.logMessage({
        mobile: to,
        direction: "OUTBOUND",
        type: "text",
        text: text,
        whatsappMessageId: response.data.messages?.[0]?.id,
        status: "sent"
      });

      return { success: true, data: response?.data };

    } catch (error) {
      console.log(error.response?.data || error.message);
      throw new Error("Failed to send Text message");
    }
  }

  async sendInteractiveMessage({ to, type, body, action, accessToken, phoneNumberId }) {

    if (!accessToken || !phoneNumberId) {
      console.error("Missing WhatsApp credentials for sendInteractiveMessage");
      throw new Error("Missing WhatsApp credentials");
    }

    const payload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "interactive",
      interactive: {
        type: type, // 'list' or 'button'
        body: {
          text: body
        },
        action: action
      }
    };

    try {
      const response = await axios.post(`${this.baseUrl}/${phoneNumberId}/messages`, payload, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        }
      });

      // Audit Log
      await whatsappAuditService.logMessage({
        mobile: to,
        direction: "OUTBOUND",
        type: "interactive",
        text: body, // Logging the body text
        whatsappMessageId: response.data.messages?.[0]?.id,
        status: "sent",
        payload: { type, action } // saving details
      });

      return { success: true, data: response?.data };

    } catch (error) {
      console.log(error.response?.data || error.message);
      throw new Error("Failed to send Interactive message");
    }
  }

  async markRead(messageId, accessToken, phoneNumberId) {
    // console.log("marking as read");
    if (!accessToken || !phoneNumberId) {
      console.error("Missing WhatsApp credentials for markRead");
      return;
    }

    try {
      await axios.post(`${this.baseUrl}/${phoneNumberId}/messages`,
        {
          messaging_product: "whatsapp",
          status: "read",
          message_id: messageId
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json"
          }
        }
      );
    } catch (error) {
      console.error("Error marking message as read:", error.response?.data || error.message);
    }
  }


  async sendMiniStatement({ from, customerId, accessToken, phoneNumberId }) {

    // 1. Independently fetch the last 4 DUE_ADDED transactions for this customer
    const dueTransactions = await Transaction.find({
      customerId,
      type: "DUE_ADDED"
    })
      .sort({ createdAt: -1 })
      .limit(4);

    if (dueTransactions.length === 0) {
      if (accessToken && phoneNumberId) {
        return this.sendTextMessage({
          to: from,
          text: "No due transactions found.",
          accessToken,
          phoneNumberId
        });
      }
      return;
    }

    let statementText = `*📄 MINI STATEMENT*\n`;
    statementText += `--------------------------------\n`;

    let grandTotalPaid = 0;
    let grandTotalPending = 0;

    for (const transaction of dueTransactions) {
      // 2. For each due, independently fetch its linked payments from DB
      const linkedPayments = await Transaction.find({
        linkedDueTransaction: transaction._id,
        type: "PAYMENT"
      }).sort({ createdAt: 1 });

      const dueDate = transaction.dueDate
        ? new Date(transaction.dueDate).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric"
        })
        : "N/A";

      const totalPaid = linkedPayments.reduce((sum, tx) => sum + tx.amount, 0);
      const remainingForThisDue = transaction.amount - totalPaid;

      grandTotalPaid += totalPaid;
      grandTotalPending += remainingForThisDue;

      statementText += `*DUE #${transaction._id.toString().slice(-4)}* (${dueDate})\n`;
      statementText += `Original: ₹${transaction.amount}\n`;

      if (linkedPayments.length > 0) {
        linkedPayments.forEach(tx => {
          const date = new Date(tx.createdAt).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short"
          });
          statementText += `  └ ✅ ${date}: ₹${tx.amount}\n`;
        });
      } else {
        statementText += `  └ _No payments yet_\n`;
      }

      statementText += `Pending: ₹${remainingForThisDue}\n`;
      statementText += `--------------------------------\n`;
    }

    // Add Grand Summary
    statementText += `*SUMMARY*\n`;
    statementText += `Total Paid: ₹${grandTotalPaid}\n`;
    statementText += `*Total Pending Due: ₹${grandTotalPending}*`;

    if (accessToken && phoneNumberId) {
      await this.sendTextMessage({
        to: from,
        text: statementText,
        accessToken,
        phoneNumberId
      });
    } else {
      console.error("Merchant WhatsApp credentials not configured");
    }
  }
}

export default new WhatsappService();
