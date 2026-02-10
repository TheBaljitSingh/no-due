import Reminder from "../model/remainder.model.js";
import Transaction from "../model/transaction.model.js";
import Customer from "../model/customer.model.js";
import whatsappService from "./whatsapp.service.js";
import mongoose from "mongoose";
import { canSendReminder } from "../middleware/reminderLimitMiddleware.js";
import {
  REMINDER_TEMPLATE_NAMES,
  getBeforeDueTemplate,
  getDueTodayTemplate,
  getOverdueTemplate
} from "../utils/reminder.templates.js";
import User from "../model/user.model.js";
import { formatDate } from "../utils/Helper.js";

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

      console.log("payment term:\n", customer?.paymentTerm);

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
                  ? REMINDER_TEMPLATE_NAMES.INTERACTIVE_DUE_TODAY
                  : REMINDER_TEMPLATE_NAMES.INTERACTIVE_BEFORE_DUE,
              language: "en",
            },
            templateVariables: [
              customer.name,
              transaction.amount.toString(),
              formatDate(transaction.dueDate), // Pass formatted date string
            ],
            scheduledFor,
            status: "pending",
            source: "auto",
          }],

        );
      }


    } catch (err) {
      console.log(err);
      throw err; // let controller handle response
    }
  }


  /*MANUAL SEND NOW REMINDER*/
  async sendNow({ transactionId, templateName, variables }) {
    const transaction = await Transaction
      .findById(transactionId)
      .populate("customerId")
      .populate({ path: "metadata.operatorId", select: "companyName" });

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
      reminderType: REMINDER_TYPES.DUE_TODAY, // Defaulting types might need adjustment based on date but caller usually decides templateName
      whatsappTemplate: { name: templateName, language: "en" },
      templateVariables: variables,
      scheduledFor: new Date(),
      status: "pending",
      source: "manual",
    });

    try {
      const isInteractive = Object.values(REMINDER_TEMPLATE_NAMES).includes(templateName);

      if (isInteractive) {
        const companyName = transaction.metadata?.operatorId?.companyName || "No Due";
        let messagePayload;

        // variables expected: [name, amount, dueDate]
        const [name, amount, dueDate] = variables;

        if (templateName === REMINDER_TEMPLATE_NAMES.INTERACTIVE_BEFORE_DUE) {
          messagePayload = getBeforeDueTemplate(name, amount, new Date(dueDate), companyName);
          // messagePayload = getBeforeDueTemplate(name, amount, new Date(dueDate));
        } else if (templateName === REMINDER_TEMPLATE_NAMES.INTERACTIVE_DUE_TODAY) {
          messagePayload = getDueTodayTemplate(name, amount, new Date(dueDate), companyName);
        } else if (templateName === REMINDER_TEMPLATE_NAMES.INTERACTIVE_OVERDUE) {
          messagePayload = getOverdueTemplate(name, amount, new Date(dueDate), companyName);
        }

        // Fetch credentials from Customer -> User
        const customer = await Customer.findById(transaction.customerId._id).populate('CustomerOfComapny');
        const merchant = customer?.CustomerOfComapny;

        if (!merchant || !merchant.whatsapp || !merchant.whatsapp.accessToken) {
          throw new Error("Merchant WhatsApp credentials not found");
        }

        if (messagePayload) {
          await whatsappService.sendTemplateMessage({
            to: `${transaction.customerId.mobile}`,
            templateName: messagePayload.templateName,
            variables: messagePayload.variables,
            language: "en",
            accessToken: merchant.whatsapp.accessToken,
            phoneNumberId: merchant.whatsapp.phoneNumberId
          });
        }
      } else {
        // Fetch credentials from Customer -> User
        const customer = await Customer.findById(transaction.customerId._id).populate('CustomerOfComapny');
        const merchant = customer?.CustomerOfComapny;

        if (!merchant || !merchant.whatsapp || !merchant.whatsapp.accessToken) {
          throw new Error("Merchant WhatsApp credentials not found");
        }

        await whatsappService.sendTemplateMessage({
          to: `${transaction.customerId.mobile}`,
          templateName,
          variables,
          language: "en ",
          accessToken: merchant.whatsapp.accessToken,
          phoneNumberId: merchant.whatsapp.phoneNumberId
        });
      }

      reminder.status = "sent";
      reminder.sentAt = new Date();
      await reminder.save();

      //also updating in the customer table lastReminder sent
      await Customer.findByIdAndUpdate(transaction.customerId._id, {
        lastReminder: reminder.sentAt
      });
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
    console.log("scheduleByUser");
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
      templateName = REMINDER_TEMPLATE_NAMES.INTERACTIVE_OVERDUE;
    } else if (scheduleDate.getTime() === dueDate.getTime()) {
      reminderType = "due_today";
      templateName = REMINDER_TEMPLATE_NAMES.INTERACTIVE_DUE_TODAY;
    } else {
      reminderType = "before_due";
      templateName = REMINDER_TEMPLATE_NAMES.INTERACTIVE_BEFORE_DUE;
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
        transaction.dueDate, // Store raw date
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
      status: { $in: ['pending', 'rescheduled'] },
      scheduledFor: { $lte: now },
    })
      .populate({
        path: "transactionId",
        populate: [
          { path: "customerId" },
          { path: "metadata.operatorId", select: " companyName" }
        ],
      });


    console.log("will process this reminder", reminders);



    for (const reminder of reminders) {
      // console.log(reminder);
      try {
        const tx = reminder.transactionId;
        console.log("tx", tx);

        if (!tx || tx?.paymentStatus === "PAID") {
          //if already paid then cancelling the rminder for future
          reminder.status = "cancelled";
          reminder.cancelledAt = new Date();
          await reminder.save();
          continue;
        }

        // Check if reminders are paused for this transaction
        if (tx.reminderPausedUntil && new Date(tx.reminderPausedUntil) > new Date()) {
          console.log(`Reminder paused for transaction ${tx._id} until ${tx.reminderPausedUntil}. Rescheduling.`);
          reminder.scheduledFor = tx.reminderPausedUntil;
          reminder.status = "rescheduled";
          await reminder.save();
          continue;
        }

        // prevent sending same reminder type again within cooldown window
        const canSend = await canSendReminder({
          transactionId: tx._id,
          reminderType: reminder.reminderType,
        });

        if (!canSend) continue;



        const companyName = reminder.transactionId?.metadata?.operatorId?.companyName || "company name";
        let messagePayload;
        const [name, amount, dueDate] = reminder.templateVariables; // Ensure variables stored match this order
        let templateName = reminder?.whatsappTemplate?.name;
        if (templateName === REMINDER_TEMPLATE_NAMES.INTERACTIVE_BEFORE_DUE) {
          messagePayload = getBeforeDueTemplate(name, amount, new Date(dueDate), companyName);
        } else if (templateName === REMINDER_TEMPLATE_NAMES.INTERACTIVE_DUE_TODAY) {
          messagePayload = getDueTodayTemplate(name, amount, new Date(dueDate), companyName);
        } else if (templateName === REMINDER_TEMPLATE_NAMES.INTERACTIVE_OVERDUE) {
          messagePayload = getOverdueTemplate(name, amount, new Date(dueDate), companyName);
        }

        console.log("message payload: ", messagePayload, "\n");

        if (messagePayload) {
          // Fetch credentials from Customer -> User
          // reminder.customerId might be populated but we need to ensure we get the User.
          // Reminder has customerId, Transaction has customerId. 
          // Let's use reminder.customerId and populate CustomerOfComapny
          const customer = await Customer.findById(reminder.customerId._id || reminder.customerId).populate('CustomerOfComapny');
          const merchant = customer?.CustomerOfComapny;

          if (!merchant || !merchant.whatsapp || !merchant.whatsapp.accessToken) {
            console.error(`[Reminder Service] No WhatsApp credentials for customer ${customer._id}`);
            // fail safely or continue
            throw new Error("No WhatsApp credentials");
          }

          await whatsappService.sendTemplateMessage({
            to: `${tx.customerId.mobile}`,
            templateName: messagePayload.templateName,
            variables: messagePayload.variables,
            language: "en",
            accessToken: merchant.whatsapp.accessToken,
            phoneNumberId: merchant.whatsapp.phoneNumberId
          });

          reminder.status = "sent";
          reminder.sentAt = new Date();
          reminder.source = "auto";
          await reminder.save();

          //same here updating lastReminder for this user
          await Customer.findByIdAndUpdate(reminder.customerId._id, {
            lastReminder: reminder.sentAt
          });
        } else {
          console.warn(`[Reminder Service] Unknown template or missing payload for template: ${templateName}`);
          reminder.status = "failed";
          reminder.lastError = `Unknown template: ${templateName} or missing payload`;
          await reminder.save();
        }

      } catch (err) {
        reminder.attempts += 1;
        reminder.lastError = err.message;
        await reminder.save();
      }
    }
  }

  /* AFTER DUE (CRON BASED)*/
  // async createAfterDueReminders() {
  //   //currently there is no user

  //   const today = new Date();
  //   today.setHours(0, 0, 0, 0);

  //   const overdueTxs = await Transaction.find({
  //     type: "DUE_ADDED",
  //     paymentStatus: { $ne: "PAID" },
  //     dueDate: { $lt: today },
  //   }).populate("customerId");

  //   for (const tx of overdueTxs) {
  //     const exists = await Reminder.findOne({
  //       transactionId: tx._id,
  //       reminderType: REMINDER_TYPES.AFTER_DUE,
  //       status: { $in: ["pending", "sent"] },
  //     });


  //     if (exists) continue;

  //     await Reminder.create({
  //       customerId: tx.customerId._id,
  //       transactionId: tx._id,
  //       reminderType: REMINDER_TYPES.AFTER_DUE,
  //       // whatsappTemplate: {
  //       //   name: REMINDER_TEMPLATE_NAMES.INTERACTIVE_OVERDUE,
  //       //   language: "en",
  //       // },
  //       templateVariables: [
  //         tx.customerId.name,
  //         tx.amount.toString(),
  //         tx.dueDate, // Store raw date
  //       ],
  //       scheduledFor: new Date(),
  //       status: "pending",
  //       source: "auto",
  //     });
  //   }
  // }
  /* RESCHEDULE REMINDER */
  async rescheduleReminder({ reminderId, scheduledFor }) {
    const reminder = await Reminder.findById(reminderId);

    if (!reminder) {
      throw new Error("Reminder not found");
    }

    if (reminder.status !== "pending") {
      throw new Error("Only pending reminders can be rescheduled");
    }

    // Optional: prevent duplicate reminders at same time
    const exists = await Reminder.findOne({
      _id: { $ne: reminderId },
      transactionId: reminder.transactionId,
      scheduledFor: new Date(scheduledFor),
    });

    if (exists) {
      throw new Error("Another reminder is already scheduled for this time");
    }

    reminder.scheduledFor = new Date(scheduledFor);

    await reminder.save();

    return reminder;
  }

}

export default new ReminderService();
