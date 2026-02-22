import Customer from "../model/customer.model.js";
import Transaction from "../model/transaction.model.js";
import whatsappService from "./whatsapp.service.js"; // Importing service for sending statement
import notificationService from "./notification.service.js";


export const getCurrentDue = async ({ from, merchantId }) => {
  console.log(from);
  try {
    const customer = await Customer.findOne({ mobile: from, CustomerOfComapny: merchantId });

    if (!customer) {
      return { text: "Customer not found.", success: false };
    }

    return {
      text: `Your current due is ₹${customer.currentDue}`,
      success: true
    };
  } catch (error) {
    console.error("getCurrentDue error:", error);
    return { text: "Something went wrong.", success: false };
  }
}

import Reminder from "../model/reminder.model.js";

export const updateTransactionStatus = async ({ from, actionId, contextId, merchantId }) => {
  console.log("contextId", contextId);
  console.log(`Updating Transaction Status for ${from}, Action: ${actionId}, ContextId: ${contextId}`);

  try {
    const customer = await Customer.findOne({ mobile: from, CustomerOfComapny: merchantId }).populate('CustomerOfComapny');
    if (!customer) {
      console.error(`Customer not found for mobile: ${from}`);
      return;
    }

    let searchCriteria = {
      customerId: customer._id,
      type: "DUE_ADDED",
      paymentStatus: { $in: ["PENDING", "PARTIAL", "OVERDUE"] },
    };

    let transaction = null;

    // 1. Try to find transaction via Reminder if contextId (message ID) is provided
    if (contextId) {
      const reminder = await Reminder.findOne({ whatsappMessageId: contextId });
      if (reminder && reminder.transactionId) {
        console.log(`Found reminder linked to transaction ${reminder.transactionId}`);
        transaction = await Transaction.findOne({ _id: reminder.transactionId, ...searchCriteria });
      }
    }

    if (!transaction) {
      console.log(`No pending due found for customer for this action ${actionId} and contextId ${contextId} and customerId ${customer._id}`);
      //because i will catch the user response from the sended template message's list buttons
      return;
    }

    const now = new Date();
    let updates = {};
    let notificationMsg = "";

    switch (actionId) {
      case "I will pay today":
        transaction.excuseCount = (transaction.excuseCount || 0) + 1;
        updates = {
          commitmentStatus: "COMMITTED_TODAY",
          expectedPaymentDate: now,
          reminderPausedUntil: new Date(now.getTime() + 24 * 60 * 60 * 1000), // +24 hours
        };
        if (transaction.excuseCount >= 3) {
          notificationMsg = `Customer ${customer.name} (${customer.mobile}) is repeatedly saying 'I will pay today' (Excuse #${transaction.excuseCount}). please contact manually.`;
          updates.commitmentStatus = "LOOP_BROKEN";
        }
        break;

      case "I will pay within a week":
        transaction.excuseCount = (transaction.excuseCount || 0) + 1;
        const nextWeek = new Date(now);
        nextWeek.setDate(nextWeek.getDate() + 7);
        updates = {
          commitmentStatus: "COMMITTED_THIS_WEEK",
          expectedPaymentDate: nextWeek,
          reminderPausedUntil: nextWeek,
        };
        if (transaction.excuseCount >= 2) {
          notificationMsg = `Customer ${customer.name} (${customer.mobile}) is repeatedly promising to pay 'within a week' (Excuse #${transaction.excuseCount}). please contact manually.`;
          updates.commitmentStatus = "LOOP_BROKEN";
        }
        break;

      case "I will pay soon":
        transaction.excuseCount = (transaction.excuseCount || 0) + 1;
        updates = {
          commitmentStatus: "PAYING_SOON",
          reminderPausedUntil: new Date(now.getTime() + 42 * 60 * 60 * 1000), // +42 hours
        };
        if (transaction.excuseCount >= 2) {
          notificationMsg = `Customer ${customer.name} (${customer.mobile}) is repeatedly saying 'I will pay soon' (Excuse #${transaction.excuseCount}). please contact manually.`;
          updates.commitmentStatus = "LOOP_BROKEN";
        }
        break;

      case "Need statement":
        updates = {
          commitmentStatus: "STATEMENT_REQUESTED",
          reminderPausedUntil: new Date(now.getTime() + 48 * 60 * 60 * 1000), // +48 hours
        };
        notificationMsg = `Customer ${customer.name} (${customer.mobile}) has requested a statement for their due of ₹${transaction.amount}.`;
        break;

      default:
        console.warn(`Unhandled Action ID in updateTransactionStatus: ${actionId}`);
        return;
    }

    // Apply updates
    Object.assign(transaction, updates);
    transaction.lastCustomerActionAt = now;
    await transaction.save();
    console.log(`Transaction ${transaction._id} updated with ${JSON.stringify(updates)}`);

    // Send notification if message generated
    if (notificationMsg) {

      // Also save to internal notification system
      try {
        //notification should be created only on loop break or customer demanded the the statements
        const createdNotification = await notificationService.createNotification({
          userId: customer.CustomerOfComapny._id,
          relatedCustomerId: customer._id,
          title: actionId === "Need statement" ? "Statement Requested" : "Reminder Loop Broken",
          message: notificationMsg,
          type: actionId === "Need statement" ? "statement_request_alert" : "excuse_alert"
        });
        if (createdNotification) {
          console.log(`[Notification created]: for this action (${actionId})`);
        }
      } catch (dbNotifyErr) {
        console.error("Failed to save database notification:", dbNotifyErr);
      }
    }

  } catch (error) {
    console.error("Error in updateTransactionStatus:", error);
  }
};

