import whatsAppService from "../../services/whatsapp.service.js";

export const sendMainMenu = async (to, mercantCredentials) => {
    const menu = {
        to,
        type: "list",
        body: "Welcome to No-Due! Please select an option below:",
        action: {
        button: "Main Menu",
        sections: [
          {
            title: "Available Options",
            rows: [
              {
                id: "CHECK_CURRENT_DUE",
                title: "Current Due",
                description: "View my current outstanding dues"
              },{
                id:"MINI_STATEMENT",
                title:"Mini statement",
                description:"Get mini statement"
              }
            ]
          }
        ]
      }
    };

    if (mercantCredentials?.accessToken && mercantCredentials?.phoneNumberId) {
      return await whatsAppService.sendInteractiveMessage({
        to: menu.to,
        type: menu.type,
        body: menu.body,
        action: menu.action,
        accessToken: mercantCredentials.accessToken,
        phoneNumberId: mercantCredentials.phoneNumberId
      });
    } else {
      console.error("Merchant WhatsApp credentials not provided");
      return null;
    }
};
