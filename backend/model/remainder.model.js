import { Schema } from "mongoose";
import { connection } from "../database/databaseConfig.js";

const reminderSchema = new Schema(
  {
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      index: true
    },

    // reference to transaction / due entry
    transactionId: {
      type: Schema.Types.ObjectId,
      ref: "Transaction",
      required: true,
      index: true
    },

    reminderType: {
      type: String,
      enum: ["before_due", "due_today", "after_due"], // added another col source for filteration
      required: true
    },

    message: {
  type: String,
  default: ""
},

    whatsappTemplate: {
      name: { type: String, required: true },
      language: { type: String, default: 'en' }
    },

    templateVariables: [{
      type: String
    },],

    scheduledFor: {
      type: Date,
      required: true,
      index: true
    },

    sentAt: {
      type: Date
    },

    status: {
      type: String,
      enum: ["pending", "sent", "failed","cancelled"],
      default: "pending",
      index: true
    },

    attempts: {
      type: Number,
      default: 0
    },

    lastError: {
      type: String
    },
    source:{
      type:String,
      enum:['auto','manual'],
      default: "manual"
    }
  },
  {
    timestamps: true
  }
);

reminderSchema.index(
  { transactionId: 1, reminderType: 1 ,scheduledFor:1},
  { unique: true }
);


const Reminder = connection.model("Reminder", reminderSchema);
export default Reminder;
