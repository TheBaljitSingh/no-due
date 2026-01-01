import { Schema, Types } from "mongoose";
import { connection } from "../database/databaseConfig.js";


const whatsappConversationSchema = new Schema({
  customerId: {
    type: Types.ObjectId,
    ref: "Customer",
    required: true,
    unique: true,
    index: true,
    default : null
  },

  mobile: {
    type: String,
    required: true,
    index: true,
  },

  lastMessage: {
    type: String,
    default: "",
  },

  unreadCount: {
    type: Number,
    default: 0,
  },

  lastMessageAt: {
    type: Date,
    default: Date.now,
    index: true,
  }
}, { timestamps: true });


console.log("connection",connection);
const whatsappConversation =  connection.model("WhatsappConversation", whatsappConversationSchema);

export default whatsappConversation;