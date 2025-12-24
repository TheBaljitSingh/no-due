import { Schema } from "mongoose";
import { connection } from "../database/databaseConfig.js";

const TransactionSchema = new Schema(
  {
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

    // Amount of this transaction
    amount: {
      type: Number,
      required: true,
      min: [0, "Transaction amount cannot be negative"],
    },

    // ONLY for DUE_ADDED ?? it is for the payment right?
    paidAmount: {
      type: Number,
      default: 0,
      min: [0, "Paid amount cannot be negative"],
    },

    // Status of a DUE (not payment)
    paymentStatus: {
      type: String,
      enum: ["PENDING", "PARTIAL", "PAID","OVERDUE"],
      default: function () {
        return this.type === "DUE_ADDED" ? "PENDING" : undefined;
      },
    },

    // Due date (only for DUE_ADDED)
    dueDate: {
      type: Date,
    },

    // PAYMENT → which due it is paying
    linkedDueTransaction: {
      type: Schema.Types.ObjectId,
      ref: "Transaction",
      default: null,
    },

    metadata: {
      note: String,
      invoiceId: String,
      operatorId: { type: Schema.Types.ObjectId, ref: "User" },
    },
  },
  { timestamps: true,
    toJSON: { virtuals: true },  
    toObject: { virtuals: true }, 
   }
);


TransactionSchema.pre("save", function () {
  if (this.type === "PAYMENT" && !this.linkedDueTransaction) {
    return next(new Error("PAYMENT must reference a due transaction"));
  }

  if (this.type !== "DUE_ADDED") {
    this.paymentStatus = undefined;
    this.paidAmount = undefined;
    this.dueDate = undefined;
  }

});

TransactionSchema.virtual("remainingDue").get(function () {
  if (this.type !== "DUE_ADDED") return undefined;
  return this.amount - this.paidAmount;
});



const Transaction = connection.model("Transaction", TransactionSchema);

export default Transaction;


// {
//   type: "DUE_ADDED",
//   amount: 500,
//   paidAmount: 200,
//   paymentStatus: "PARTIAL",
//   dueDate: "2025-01-15"
// }
// {
//   type: "PAYMENT",
//   amount: 200,
//   linkedDueTransaction: "due_id"
// }