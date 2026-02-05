import axios from 'axios';

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
              parameters: variables.map(v => ({
                type: "text",
                text: String(v)
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

      return response.data;
    } catch (error) {
      console.error('Error sending template message:', error.response?.data || error.message);
      throw error.response?.data || new Error('Failed to send template message');
    }
  }
}

export default new WhatsappService();
