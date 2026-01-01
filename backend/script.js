import whatsappConversation from "./model/whatsappConversation.js";

async function insertBulk  (){

    await whatsappConversation.insertMany([{
        customerId:"694bb0edea61c60ecaabcdc7",
        mobile:'918709548015',
        lastMessage:"hello bhai",
        unreadCount:0,

    },
    {
        customerId:"695211b575e2a53509242979",
        mobile:'918733973175',
        lastMessage:"kya be",
        unreadCount:0,
    }])

}

export default insertBulk;

