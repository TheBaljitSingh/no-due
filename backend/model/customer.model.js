import mongoose, { Schema, Types } from "mongoose";
// import { connection } from "../database/databaseConfig.js";

const customerSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        minlength: [3, "Name must be at least 3 characters long"],
        maxlength: [100, "Name can be at most 100 characters long"],
    },
    mobile: {
        type: String,
        trim: true,
        validate: {
            validator: function (v) {
                return /^91\d{10}$/.test(v); // only this format 918709548015
            },
            message: "Please enter a valid mobile number!!"
        },
        maxlength: 12,
        minlength: 12
    },
    email: {
        type: String,
        trim: true,
        lowercase: true,
        validate: {
            validator: function (v) {
                if (!v) return true; // allowing empty or null emails
                if (v.length < 5 || v.length > 255) return false;
                return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(v);
            },
            message: "Please enter a valid email address!!"
        },
    },
    currentDue: {
        type: Number,
        default: 0,
        min: [0, "Due amount cannot be negative"],
    },
    lastTransaction: {
        type: Schema.Types.ObjectId, ref: "Transaction",
        default: null,
        min: [0, "Overdue amount cannot be negative"],
    },
    lastReminder: {
        type: Date,
        default: null,
    },
    feedback: {
        type: String,
        trim: true,
        maxlength: [500, "Feedback can be at most 500 characters long"],
    },
    status: {
        type: String,
        enum: ["Paid", "Due", "Overdue"],
        default: "Due",

    },
    gender: {
        type: String,
        enum: ["male", "female", "other"],
        default: "other",
    },
    CustomerOfComapny: {
        type: Types.ObjectId,
        ref: 'User',
        required: true,
    },
    paymentTerm: {
        type: Schema.Types.ObjectId,
        ref: 'PaymentTerm',
        default: null,
    },
}, { timestamps: true });



const Customer = mongoose.model('Customer', customerSchema);

export default Customer;