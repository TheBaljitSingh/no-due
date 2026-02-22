import mongoose from "mongoose";

const whatsappSessionSchema = new mongoose.Schema({
  mobile: {
    type: String,
    index: true
  },
  merchantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },
  state: {
    type: String,
    default: "MAIN_MENU"
  },
  data: {
    type: Object,
    default: {}
  },
  lastActiveAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    required: true
  }
});

// Compound index for multi-tenancy
whatsappSessionSchema.index({ mobile: 1, merchantId: 1 }, { unique: true });
// TTL index
whatsappSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model("WhatsappSession", whatsappSessionSchema);
