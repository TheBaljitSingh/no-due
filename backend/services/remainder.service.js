import Reminder from "../model/remainder.model.js";
import Transaction from "../model/transaction.model.js";
import Customer from "../model/customer.model.js";
import whatsappService from "./whatsapp.service.js";
import mongoose from "mongoose";

const REMINDER_TYPES = {
  BEFORE_DUE: "before_due",
  DUE_TODAY: "due_today",
  AFTER_DUE: "after_due",
};

class ReminderService {
  /* CREATE REMINDER FOR DUE*/

  async createForDue({ transactionId }) {
  try {
    const transaction = await Transaction
      .findById(transactionId)
      .populate("customerId")

    if (!transaction) throw new Error("Transaction not found");
    if (transaction.type !== "DUE_ADDED") {
      throw new Error("Reminders only allowed for DUE_ADDED");
    }
    if (transaction.paymentStatus === "PAID") return;

    const customer = await Customer
      .findById(transaction.customerId._id)
      .populate("paymentTerm");

    if (!customer?.paymentTerm) return;

    for (const offset of customer.paymentTerm.reminderOffsets) {
      const scheduledFor = new Date(transaction.dueDate);
      scheduledFor.setDate(scheduledFor.getDate() - offset);
      scheduledFor.setHours(9, 0, 0, 0);

      if (scheduledFor < new Date()) continue;

      const reminderType =
        offset === 0
          ? REMINDER_TYPES.DUE_TODAY
          : REMINDER_TYPES.BEFORE_DUE;

      const exists = await Reminder.findOne({
        transactionId: transaction._id,
        reminderType,
        scheduledFor,
      })

      if (exists) continue;

      await Reminder.create(
        [{
          customerId: customer._id,
          transactionId: transaction._id,
          reminderType,
          whatsappTemplate: {
            name:
              reminderType === REMINDER_TYPES.DUE_TODAY
                ? "payment_due_today"
                : "payment_due_before",
            language: "en",
          },
          templateVariables: [
            customer.name,
            transaction.amount.toString(),
            transaction.dueDate.toDateString(),
          ],
          scheduledFor,
          status: "pending",
          source: "auto",
        }],
      
      );
    }


  } catch (err) {
    throw err; // let controller handle response
  }
}


  /*MANUAL SEND NOW REMINDER*/
  async sendNow({ transactionId, templateName, variables }) {
    const transaction = await Transaction
      .findById(transactionId)
      .populate("customerId");

    if (!transaction) throw new Error("Transaction not found");
    if (transaction.type !== "DUE_ADDED") {
      throw new Error("Invalid transaction");
    }
    if (transaction.paymentStatus === "PAID") {
      throw new Error("Cannot send reminder for paid due");
    }


    const reminder = await Reminder.create({
      customerId: transaction.customerId._id,
      transactionId,
      reminderType: REMINDER_TYPES.DUE_TODAY,
      whatsappTemplate: { name: templateName, language: "en" },
      templateVariables: variables,
      scheduledFor: new Date(),
      status: "pending",
      source: "manual",
    });

    try {
      await whatsappService.sendTemplateMessage({
        to: `91${transaction.customerId.mobile}`,
        templateName,
        variables,
      });

      reminder.status = "sent";
      reminder.sentAt = new Date();
      await reminder.save();
      return reminder;
    } catch (err) {
      reminder.status = "failed";
      reminder.lastError = err.message;
      await reminder.save();
      throw err;
    }
  };

  /* USER SCHEDULED REMINDER */
  async scheduleByUser({ transactionId, scheduledFor }) {
    const transaction = await Transaction
      .findById(transactionId)
      .populate("customerId");

    if (!transaction) throw new Error("Transaction not found");

    if (transaction.type !== "DUE_ADDED") {
      throw new Error("Only dues can have reminders");
    }

    if (transaction.paymentStatus === "PAID") {
      throw new Error("Cannot schedule reminder for paid due");
    }

    const dueDate = new Date(transaction.dueDate);
    const scheduleDate = new Date(scheduledFor);

    dueDate.setHours(0, 0, 0, 0);
    scheduleDate.setHours(0, 0, 0, 0);

    let reminderType;
    let templateName;

    if (scheduleDate > dueDate) {
      reminderType = "after_due";
      templateName = "nodue_overdue_1";
    } else if (scheduleDate.getTime() === dueDate.getTime()) {
      reminderType = "due_today";
      templateName = "nodue_due_today_1";
    } else {
      reminderType = "before_due";
      templateName = "nodue_before_due_1";
    }

    const exists = await Reminder.findOne({
      transactionId,
      scheduledFor: new Date(scheduledFor),
    });

    if (exists) {
      throw new Error("Reminder already scheduled for this time");
    }

    return Reminder.create({
      customerId: transaction.customerId._id,
      transactionId,
      reminderType,
      whatsappTemplate: {
        name: templateName,
        language: "en",
      },
      templateVariables: [
        transaction.customerId.name,
        transaction.customerId.currentDue.toString(),
       reminderType==='due_today'?'': transaction.dueDate.toDateString(),
      ],
      scheduledFor: new Date(scheduledFor),
      status: "pending",
      source: "manual",
    });
  }


  /* CRON: PROCESS SCHEDULED */
  async processScheduledReminders() {
    const now = new Date();

    const reminders = await Reminder.find({
      status: "pending",
      scheduledFor: { $lte: now },
    }).populate({
      path: "transactionId",
      populate: { path: "customerId" },
    });

    

    for (const reminder of reminders) {
      // console.log(reminder);
      try {
        const tx = reminder.transactionId;

        if (!tx || tx.paymentStatus === "PAID") {
          reminder.status = "cancelled";
          reminder.cancelledAt = new Date();
          await reminder.save();
          continue;
        }


        const recent = await Reminder.findOne({
          transactionId: tx._id,
          reminderType: reminder.reminderType,
          status: "sent",
          // source: "auto",
          sentAt: { $gte: 1000*60*60*24 },
        });


        if (recent) {
          console.log("skipping, recently sended within 24 hr");
          continue
        };

        await whatsappService.sendTemplateMessage({
          to: `91${tx.customerId.mobile}`,
          templateName: reminder.whatsappTemplate.name,
          variables: reminder.templateVariables,
        });

        reminder.status = "sent";
        reminder.sentAt = new Date();
        reminder.source = "auto";
        await reminder.save();

      } catch (err) {
        reminder.attempts += 1;
        reminder.lastError = err.message;
        await reminder.save();
      }
    }
  }

  /* AFTER DUE (CRON BASED)*/
  async createAfterDueReminders() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const overdueTxs = await Transaction.find({
      type: "DUE_ADDED",
      paymentStatus: { $ne: "PAID" },
      dueDate: { $lt: today },
    }).populate("customerId");

    for (const tx of overdueTxs) {
      const exists = await Reminder.findOne({
        transactionId: tx._id,
        reminderType: REMINDER_TYPES.AFTER_DUE,
        status: { $in: ["pending", "sent"] },
      });


      if (exists) continue;

      await Reminder.create({
        customerId: tx.customerId._id,
        transactionId: tx._id,
        reminderType: REMINDER_TYPES.AFTER_DUE,
        whatsappTemplate: {
          name: "nodue_overdue_1",
          language: "en",
        },
        templateVariables: [
          tx.customerId.name,
          tx.amount.toString(),
          // tx.dueDate.toDateString(),
        ],
        scheduledFor: new Date(),
        status: "pending",
        source: "auto",
      });
    }
  }
}

export default new ReminderService();