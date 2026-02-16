import Reminder from "../model/reminder.model.js";

export async function canSendReminder({
  transactionId,
  reminderType,
  cooldownMs = 24 * 60 * 60 * 1000, //after how much time another reminder of same type can be sent--> default 24 hours
}) {
  // if throttle disabled → behave exactly like "no check"
  if (!cooldownMs || cooldownMs <= 0) return true;

  const since = new Date(Date.now() - cooldownMs);

  const recent = await Reminder.findOne({
    transactionId: transactionId,
    reminderType,
    status: "sent",
    sentAt: { $gte: since },
  });

  return !recent;
}
