import { Schema, Types } from "mongoose";
import { connection } from "../database/databaseConfig.js";

const paymentTermSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
      // e.g. "Net 30", "Net 15"
    },

    owner: {
      type: Types.ObjectId,
      ref: "User",
      default: null,
      index: true
      // null => global term
      // userId => user-specific
    },

    creditDays: {
      type: Number,
      required: true,
      min: 0
      // 30, 15, 10
    },

    reminderOffsets: {
      type: [Number],
      default: [],
      /*
        reminders to sent Days BEFORE expiry
        Example for Net 30:
        [5, 2, 0]

        Means:
        expiry - 5 days
        expiry - 2 days
        expiry day
      */
      validate: {
        validator: function (arr) {
          return arr.every(d => d >= 0);
        },
        message: "Reminder offsets must be positive numbers"
      }
    },

    isDefault: {
      type: Boolean,
      default: false
    },

    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

function getDefaultOffsets(creditDays) {
  if (creditDays >= 30) return [5, 2, 0];
  if (creditDays >= 15) return [3, 1, 0];
  return [0];
}

paymentTermSchema.pre("save", function () {
  if (!this.reminderOffsets || this.reminderOffsets.length === 0) {
    this.reminderOffsets = getDefaultOffsets(this.creditDays);
  }
  this.reminderOffsets.sort((a, b) => b - a);
});

const PaymentTerm = connection.model("PaymentTerm", paymentTermSchema);

export default PaymentTerm;
