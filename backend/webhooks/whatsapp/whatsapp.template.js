import whatsAppService from "../../services/whatsapp.service.js";

export const sendMainMenu = async (to) => {
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
              }
            ]
          }
        ]
      }
    };

    return await whatsAppService.sendInteractiveMessage(menu);
};
