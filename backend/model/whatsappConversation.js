import mongoose, { Schema, Types } from "mongoose";


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


const whatsappConversation =  mongoose.model("WhatsappConversation", whatsappConversationSchema);

export default whatsappConversation;