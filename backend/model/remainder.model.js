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
      enum: ["BEFORE_DUE", "DUE_TODAY", "AFTER_DUE"],
      required: true
    },

    message: {
      type: String,
      required: true
    },

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
      enum: ["PENDING", "SENT", "FAILED"],
      default: "PENDING",
      index: true
    },

    attempts: {
      type: Number,
      default: 0
    },

    lastError: {
      type: String
    }
  },
  {
    timestamps: true
  }
);

const Reminder = connection.model("Reminder", reminderSchema);
export default Reminder;
