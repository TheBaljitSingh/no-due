import WhatsappSession from "../model/whatsappSession.model.js";

const SESSION_TTL_MS = Number(process.env.WHATSAPP_SESSION_TTL_MS) || 1 * 60 * 1000; // 1 minutes

export const getOrCreateSession = async (mobile, merchantId) => {
  const now = new Date();

  let session = await WhatsappSession.findOne({ mobile, merchantId });

  if (!session || session.expiresAt < now) {
    session = await WhatsappSession.findOneAndUpdate(
      { mobile, merchantId },
      {
        mobile,
        merchantId,
        state: "MAIN_MENU",
        data: {},
        lastActiveAt: now,
        expiresAt: new Date(now.getTime() + SESSION_TTL_MS)
      },
      { upsert: true, new: true }
    );
  }

  return session;
};

export const updateSession = async (mobile, merchantId, updates = {}) => {
  const now = new Date();

  return WhatsappSession.findOneAndUpdate(
    { mobile, merchantId },
    {
      ...updates,
      lastActiveAt: now,
      expiresAt: new Date(now.getTime() + SESSION_TTL_MS)
    },
    { new: true }
  );
};

export const getValidSession = async (mobile, merchantId) => {
  const now = new Date();

  const session = await WhatsappSession.findOne({ mobile, merchantId });

  if (!session) return null;

  if (session.expiresAt < now) {
    await WhatsappSession.deleteOne({ mobile, merchantId });
    return null;
  }

  return session;
};