import { Schema, Types } from "mongoose";
import { connection } from "../database/databaseConfig.js";

const TransactionSchema = new Schema({
  customerId: {
    type: Schema.Types.ObjectId,
    ref: "Customer",
    required: true,
    index: true,
  },
  type: {
    type: String,
    enum: ["DUE_ADDED", "PAYMENT", "DUE_EDITED"],
    required: true,
  },

  amount: {
     type: Number, 
     required: true,
     min: [0, "Transaction amount cannot be negative"],
    },
  previousDue: {
     type: Number, 
     required: true,
     min: [0, "Previous due amount cannot be negative"],
    },
  newDue: { 
    type: Number,
     required: true ,
      min: [0, "New due amount cannot be negative"],
    },
  metadata: {
    note: String,
    invoiceId: String,
    operatorId: { type: Schema.Types.ObjectId, ref: "User" },
  },
}, { timestamps: true });

const Transaction = connection.model("Transaction", TransactionSchema);

export default Transaction;