import mongoose from "mongoose";

const whatsappSessionSchema = new mongoose.Schema({
  mobile: {
    type: String,
    unique: true,
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
    require:true
  }
});


whatsappSessionSchema.index({expireAt:1},{expireAfterSeconds:0})


export default mongoose.model("WhatsappSession", whatsappSessionSchema);
