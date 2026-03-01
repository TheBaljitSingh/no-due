import mongoose, { Schema, Types } from "mongoose";

const notificationSchema = new Schema(
  {
    userId: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },
    relatedCustomerId: {
      type: Types.ObjectId,
      ref: "Customer",
      // required: true
      /**
       * if notification is system notification then it wont be a customer related
       */
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: [
        "statement_request_alert",
        "excuse_alert",
        "overdue_alert",
        "high_risk_alert",
        "system_alert",
      ],
      default: "system_alert", // doubt
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    metadata: {
      type: Object, //Mixed or Object
      default: {},
    },
  },
  { timestamps: true },
);

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;
