import mongoose, { Schema, Types } from "mongoose";



const whatsappMessageSchema = new Schema({
  // WhatsApp provided message id (wamid.xxx)
  whatsappMessageId: {
    type: String,
    index: true,
    unique: true,
    sparse: true,
  },

  customerId: {
    type: String, // Changed from ObjectId to String for webhook ingestion
    // ref: "Customer",
    required: true,
    index: true,
  },
  // The ID of the message this message is responding to (context.id)
  responseToMessageId:{
    type:String,
    index:true,
    sparse:true // it only index this field if it actually exists

  },
  mobile: {
    type: String,
    required: true,
    index: true,
  },

  direction: {
    type: String,
    enum: ["INBOUND", "OUTBOUND"],
    required: true,
  },

  type: {
    type: String,
    enum: ["text", "image", "template", "button", "interactive", "list"],
    default: "text",
  },

  text: {
    type: String,
    default: "",
  },
  context: {
    type: Object,
  },
  templateName: {
    type: String,
    default: null,
  },

  status: {
    type: String,
    enum: ["queued", "sent", "delivered", "read", "failed", "received"],
    default: "queued",
    index: true,
  },

  error: {
    type: String,
    default: null,
  },

  metadata: {
    type: Object,
    default: {},
  },

  timestamp: {
    type: Date,
    required: true,
    index: true,
  },
},
  { timestamps: true }
);

const whatsappMessage = mongoose.model("WhatsappMessage", whatsappMessageSchema);

export default whatsappMessage;