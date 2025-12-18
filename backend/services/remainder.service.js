import Reminder from "../model/remainder.model.js";
import Transaction from "../model/transaction.model.js";



import whatsappService from "./whatsapp.service.js";

const REMINDER_TYPES = { BEFORE_DUE: 'BEFORE_DUE', DUE_TODAY: 'DUE_TODAY', AFTER_DUE: "AFTER_DUE" };

class ReminderService {
  async createForDue({ transactionId }) {

    const transaction = await Transaction.findById(transactionId).populate(
      "customerId",
      "name mobile"
    );


    console.log(transaction);

    if (!transaction) {
      throw new Error("Due not found");
    }

    if (transaction.status === "PAID") {
      throw new Error("Cannot create reminder for paid due");
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dueDate = new Date(transaction.dueDate);
    dueDate.setHours(0, 0, 0, 0);

    let reminderType;

    if (dueDate > today) {
      reminderType = REMINDER_TYPES.BEFORE_DUE;
    } else if (dueDate.getTime() === today.getTime()) {
      reminderType = REMINDER_TYPES.DUE_TODAY;
    } else {
      reminderType = REMINDER_TYPES.AFTER_DUE;
    }

    const exists = await Reminder.findOne({
      transactionId,
      reminderType,
    });

    if (exists) {
      return exists;
    }

    const templateMap = {
      BEFORE_DUE: "payment_due_before",
      DUE_TODAY: "payment_due_today",
      AFTER_DUE: "payment_due_after",
    };

    return Reminder.create({
      customerId: transaction.customerId._id,
      transactionId: transaction._id,
      amount: transaction.amount,
      dueDate: transaction.dueDate,
      reminderType,
      scheduledFor: new Date(),

      whatsappTemplate: {
        name: templateMap[reminderType],
        language: "en",
      },

      templateVariables: [
        transaction.customerId.name,
        transaction.amount.toString(),
        transaction.dueDate.toDateString(),
      ],

      status: "PENDING",
    });
  }

  async sendNow({ transactionId, templateName, variables }) {
    //here templateName is payment_due_today

    console.log("service customer", transactionId, templateName, variables);
    const transaction = await Transaction.findById(transactionId).populate("customerId");
    if (!transaction) throw new Error("Transaction not found");

    console.log("transaction",transaction);

    // Create a record of this immediate reminder
    const reminder = await Reminder.create({
      customerId: transaction.customerId._id,
      transactionId: transaction._id,
      reminderType: "due_today", // generic type for ad-hoc
      message: "Manual Reminder", // Placeholder
      whatsappTemplate: { name: templateName, language: "en" }, // new obj inserting
      templateVariables: variables,
      scheduledFor: new Date(),
      status: "pending"
    });

    try {
      const result = await whatsappService.sendTemplateMessage({
        to: `91${transaction.customerId.mobile}`, // in india only, db saved without country code
        templateName,
        variables
      });

      reminder.status = "sent";
      reminder.sentAt = new Date();
      await reminder.save();
      return { success: true, reminder, providerResponse: result };
    } catch (error) {
      reminder.status = "failed";
      reminder.lastError = error.message;
      await reminder.save();
      throw error;
    }
  }

  //helpher function
static async getTemplateAndType(transactionId, scheduledFor) {
  // fetch transaction
  const tx = await Transaction.findById(transactionId);
  if (!tx) {
    throw new Error("Transaction not found");
  }

  // assume transaction has dueDate
  const dueDate = new Date(tx.lastDuePaymentDate);
  const scheduleDate = new Date(scheduledFor);

  // normalize time (important for date-only comparison)
  dueDate.setHours(0, 0, 0, 0);
  scheduleDate.setHours(0, 0, 0, 0);

  const diffInMs = scheduleDate - dueDate;
  const diffInDays = Math.round(diffInMs / (1000 * 60 * 60 * 24));

  let reminderType;
  let templateName;

  if (diffInDays > 0) {
    reminderType = "before_due";
    templateName = "nodue_before_due_1";
  } else if (diffInDays === 0) {
    reminderType = "due_today";
    templateName = "nodue_due_today_1";
  } else {
    reminderType = "after_due";
    templateName = "nodue_overdue_1";
  }

  // return in pair
  return {
    reminderType,
    templateName,
  };
}


  async schedule({ transactionId, scheduledFor,  variables }) {
    // use case: user want to schedule before the custom dueData

    //just now sended remainder manually then schedule should not sned the remainder
    const transaction = await Transaction.findById(transactionId).populate("customerId");
    if (!transaction) throw new Error("Transaction not found");


    const tempAndtype = getTemplateAndType(transactionId, scheduledFor);

    const reminder = await Reminder.create({
      customerId: transaction.customerId._id,
      transactionId: transaction._id,
      reminderType: tempAndtype.remainderType, // maybe calculated from scheduledFor data
      message: "Scheduled Reminder",
      whatsappTemplate: { name: tempAndtype.templateName, language: "en" },
      templateVariables: variables,
      scheduledFor: new Date(scheduledFor),
      status: "pending"
    });

    return reminder;
  }


  //generate this for schedular(corn job ) but have to test
  // async processScheduledReminders() {
  //   const now = new Date();
  //   const dueReminders = await Reminder.find({
  //     status: "pending",
  //     scheduledFor: { $lte: now }
  //   }).populate({
  //     path: 'transactionId',
  //     populate: { path: 'customerId' }
  //   });

  //   console.log(`Processing ${dueReminders.length} scheduled reminders...`);

  //   for (const reminder of dueReminders) {
  //     try {
  //       if (!reminder.transactionId || !reminder.transactionId.customerId) {
  //         console.warn(`Reminder ${reminder._id} has invalid data, skipping.`);
  //         reminder.status = "failed";
  //         reminder.lastError = "Invalid data linked";
  //         await reminder.save();
  //         continue;
  //       }

  //       const customer = reminder.transactionId.customerId;
  //       // Use variables from reminder or fallback
  //       const variables = reminder.templateVariables || [];

  //       await whatsappService.sendTemplateMessage({
  //         to: customer.mobile || customer.phone,
  //         templateName: reminder.whatsappTemplate.name,
  //         variables: variables
  //       });

  //       reminder.status = "sent";
  //       reminder.sentAt = new Date();
  //       await reminder.save();
  //       console.log(`Reminder ${reminder._id} sent.`);

  //     } catch (error) {
  //       console.error(`Failed to send reminder ${reminder._id}:`, error);
  //       reminder.status = "failed";
  //       reminder.lastError = error.message;
  //       reminder.attempts += 1;
  //       await reminder.save();
  //     }
  //   }
  // }
}

export default new ReminderService();
