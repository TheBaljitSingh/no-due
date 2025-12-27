import { Schema } from "mongoose";
import { connection2 } from "../database/databaseConfig.js";


const whatsappMessageSchema = new Schema(
  {
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

    phone: {
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
      enum: ["text", "image", "template", "button"],
      default: "text",
    },

    text: {
      type: String,
      default: "",
    },
    context:{
      type: Object,
    },
    templateName: {
      type: String,
      default: null,
    },

    status: {
      type: String,
      enum: ["queued", "sent", "delivered", "read", "failed"],
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

export default connection2.model("WhatsappMessage", whatsappMessageSchema);
