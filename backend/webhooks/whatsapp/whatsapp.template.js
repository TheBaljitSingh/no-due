import whatsAppService from "../../services/whatsapp.service.js";

export const sendMainMenu = async (to) => {
    const menu = {
        to,
        type: "list",
        body: "Welcome to No-Due! Please select an option below:",
        action: {
            button: "Options",
            sections: [
            {
                title:"section 123",
                rows: [
                {
                    id:"CHECK_CURRENT_DUE",
                    title:"Your current Due",
                    description:"your current due"
                },
                {
                    id:"unique-row-1",
                    title: "1",
                    description: "Number 1"           
                },
                {
                    id:"unique-row-2",
                    title: "2",
                    description: "Number 2"           
                }
                ]
            },
            {
                title:"section ABC",
                rows: [
                {
                    id:"unique-row-a",
                    title: "A",
                    description: "Char A",           
                },
                {
                    id:"unique-row-b",
                    title: "B",
                    description: "Char B",           
                }
                ]
            }
            ],
        },
    };

    return await whatsAppService.sendInteractiveMessage(menu);
};
