import mongoose, { Schema, Types } from "mongoose";

const notificationSchema = new Schema({

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    relatedCustomerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Customer",
        required: true
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ["excuse_alert", "overdue_alert", "high_risk_alert", "system_alert"],
        default: "system_alert" // doubt
    },
    isRead: {
        type: Boolean,
        default: false
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    metadata: {
        type: Object, //Mixed or Object
        default: {}
    }



}, { timestamps: true });

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;