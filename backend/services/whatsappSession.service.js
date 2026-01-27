import WhatsappSession from "../models/whatsappSession.model.js";

const SESSION_TTL_MS = Number(process.env.WHATSAPP_SESSION_TTL_MS) || 1*60*1000; // 1 minutes

export const getOrCreateSession = async (mobile) => {
  const now = new Date();

  console.log(now);

  let session = await WhatsappSession.findOne({ mobile });

  if (!session || session.expiresAt < now) {
    session = await WhatsappSession.findOneAndUpdate(
      { mobile },
      {
        mobile,
        state: "MAIN_MENU",
        data: {},
        lastActiveAt: now,
        expiresAt: new Date(now.getTime() + SESSION_TTL_MS)
      },
      { upsert: true, new: true }
    );
  }

  console.log(new Date(now.getTime() + SESSION_TTL_MS));
  console.log(session)

  return session;
};

export const updateSession = async (mobile, updates = {}) => {
  const now = new Date();

  return WhatsappSession.findOneAndUpdate(
    { mobile },
    {
      ...updates,
      lastActiveAt: now,
      expiresAt: new Date(now.getTime() + SESSION_TTL_MS)
    },
    { new: true }
  );
};
