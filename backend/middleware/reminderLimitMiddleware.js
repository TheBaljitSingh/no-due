import Reminder from "../model/reminder.model.js";

export async function canSendReminder({
  transactionId,
  reminderType,
  cooldownMs = 24 * 60 * 60 * 1000,
}) {
  if (!cooldownMs || cooldownMs <= 0) return { canSend: true };

  const since = new Date(Date.now() - cooldownMs);

  const recent = await Reminder.findOne({
    transactionId: transactionId,
    reminderType,
    status: "sent",
    sentAt: { $gte: since },
  }).sort({ sentAt: -1 });

  return {
    canSend: !recent,
    recent: recent
  };
}
