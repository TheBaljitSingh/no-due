import { Schema } from "mongoose";
import { connection } from "../database/databaseConfig";

const customerSchema = new Schema({
    customerId: {
        type: String,
        required: true,
    },
    name: {
        type: String,
        required: true,
        trim: true,
        minlength: [3, "Name must be at least 3 characters long"],
        maxlength: [100, "Name can be at most 100 characters long"],
    },
    company: {
        type: String,
        trim: true,
        maxlength: [100, "Company name can be at most 100 characters long"],
    },
    mobile: {
        type: String,
        trim: true,
        validate: {
            validator: function (v) {
                return /^(\+\d{1,3}[- ]?)?\d{10}$/.test(v); // +91-9876543210 or 9876543210
            },
            message: "Please enter a valid mobile number!!"
        },
        maxlength: 15,
        minlength: 10
    },
    email: {
        type: String,
        trim: true,
        lowercase: true,
        minlength: [5, "Email must be at least 5 characters long"],
        maxlength: [255, "Email can be at most 255 characters long"],
        validate: {
            validator: function (v) {
                return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(v);
            },
            message: "Please enter a valid email address!!"
        },
    },
    due: {
        type: Number,
        default: 0,
        min: [0, "Due amount cannot be negative"],
    },
    overdue: {
        type: Number,
        default: 0,
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
        enum: ["Paid", "Due", "Overdue", "Pending"],
        default: "Due",
    },
    gender: {
        type: String,
        enum: ["male", "female", "other"],
        default: "other",
    },
}, { timestamps: true });
const Customer = connection.model('Customer', customerSchema);

export default Customer;