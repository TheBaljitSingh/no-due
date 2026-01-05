import whatsappMessage from "../model/whatsappMessage.modal.js";
import {getIo} from "../socket/index.js"
import Customer from "../model/customer.model.js";
import whatsappConversation from "../model/whatsappConversation.js";


const io = getIo();

export async function handleIncomingMessage(msg) {


  const mobile = msg.from;
  const text = msg.text?.body || msg.type;
  const messageTime = new Date(Number(msg.timestamp) * 1000);

  const customer = await Customer.findOne({ mobile });

  const ownerId = customer?.CustomerOfComapny?.toString() || null;

  await whatsappConversation.updateOne(
    { mobile },
    {
      $setOnInsert: {
        mobile,
        customerId: customer ? customer._id : null,
      },
      $set: {
        lastMessage: text,
        lastMessageAt: messageTime
      },
      $inc: {
        unreadCount:1
      }
    },
    { upsert: true }
  );

  const result = await whatsappMessage.updateOne(
    { whatsappMessageId: msg.id },
    {
      $setOnInsert: {
        whatsappMessageId: msg.id,
        from: mobile,
        mobile,
        text,
        context: msg?.context,
        direction: "INBOUND",
        timestamp: messageTime
      }
    },
    { upsert: true }
  );

  if (result.upsertedCount === 1) {

    // Open chat
    io.to(`customer:${mobile}`).emit("new_message", {
      text,
      timestamp: messageTime,
      mobile
    });

    // Chat list preview
    if (ownerId) {
      io.to(ownerId).emit("new_message_preview", {
        text,
        timestamp: messageTime,
        mobile,
        unreadIncrement: 1
      });
    }
  }
}

export async function handleErrorMessage(status){
      const to = status.recipient_id;
      io.to(`customer:${to}`).emit("message_failed",{
        type: "WINDOW_EXPIRED",
        message:  "24-hour window expired. Please use an approved template to continue the conversation."
      });
}

