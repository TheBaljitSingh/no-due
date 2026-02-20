import Customer from "../model/customer.model.js";
import Transaction from "../model/transaction.model.js";
import whatsappService from "./whatsapp.service.js"; // Importing service for sending statement

export const getCurrentDue = async ({ from }) => {
  console.log(from);
  try {
    // const { Customer } = await import("../model/customer.model.js");

    const customer = await Customer.findOne({ mobile: from });

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

export const updateTransactionStatus = async ({ from, actionId, contextId }) => {
  console.log(`Updating Transaction Status for ${from}, Action: ${actionId}, ContextId: ${contextId}`);

  try {
    const customer = await Customer.findOne({ mobile: from });
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

    // 2. Fallback: Oldest pending due
    if (!transaction) {
      console.log("Fallback to oldest pending due");
      transaction = await Transaction.findOne(searchCriteria).sort({ dueDate: 1 });
    }

    if (!transaction) {
      console.log(`No pending due found for customer ${customer._id}`);
      // Maybe reply "You have no pending dues"?
      return;
    }

    const now = new Date();
    let updates = {};

    switch (actionId) {
      // case "PAY_TODAY": // "I will pay today"
      case "I will pay today": // "I will pay today"
        updates = {
          commitmentStatus: "COMMITTED_TODAY",
          expectedPaymentDate: now, // Set to today
          reminderPausedUntil: new Date(now.getTime() + 24 * 60 * 60 * 1000), // +24 hours
        };

        break;
/*
case "PAID_TODAY": // "Paid today"
updates = {
  commitmentStatus: "PAID_AWAITING_CONFIRMATION",
  // Pause all reminders immediately (Done via reminderPausedUntil indefinitely or check commitmentStatus)
  // Let's set a long pause or handle it in reminder service to skip if status is PAID_AWAITING_CONFIRMATION
  reminderPausedUntil: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // Pause for 7 days significantly or until verified
};
// Notify user/account owner to verify payment
console.log(`NOTIFY OWNER: Customer ${customer.name} claims to have paid.`);
try {
  // Re-fetch transaction with operator populated
  const detailedTx = await Transaction.findById(transaction._id).populate("metadata.operatorId");
  const ownerMobile = detailedTx?.metadata?.operatorId?.phoneNumber;
  
  if (ownerMobile) {
            const message = `Action Required: Customer ${customer.name} (${customer.mobile}) has marked their due of ₹${transaction.amount} as PAID today. Please verify.`;
            // Get merchant credentials
            const populatedCustomer = await Customer.findOne({ mobile: from }).populate('CustomerOfComapny');
            const merchant = populatedCustomer?.CustomerOfComapny;
            
            if (merchant?.whatsapp?.accessToken && merchant?.whatsapp?.phoneNumberId) {
              await whatsappService.sendTextMessage({
                to: ownerMobile,
                text: message,
                accessToken: merchant.whatsapp.accessToken,
                phoneNumberId: merchant.whatsapp.phoneNumberId
              });
              console.log(`Notification sent to owner ${ownerMobile}`);
            } else {
              console.error("Merchant WhatsApp credentials not configured");
          }
        }
      } catch (notifyErr) {
        console.error("Failed to notify owner:", notifyErr);
      }
      break;
      
      */
      case "I will pay within a week": // "I will pay within a week"
        const nextWeek = new Date(now);
        nextWeek.setDate(nextWeek.getDate() + 7);
        updates = {
          commitmentStatus: "COMMITTED_THIS_WEEK",
          expectedPaymentDate: nextWeek,
          reminderPausedUntil: nextWeek,
        };
        break;

      case "I will pay soon": // "I will pay soon"
        updates = {
          commitmentStatus: "PAYING_SOON",
          reminderPausedUntil: new Date(now.getTime() + 72 * 60 * 60 * 1000), // +72 hours
        };
        break;
      
      case "Need statement":
        updates = {
          commitmentStatus: "STATEMENT_REQUESTED",
          reminderPausedUntil: new Date(now.getTime() + 48 * 60 * 60 * 1000), // +48 hours
        };
        break;

      case "MINI_STATEMENT": // MENU options
      console.log("mini statement is called\n");
        // updates = {
        //   commitmentStatus: "STATEMENT_REQUESTED",
        //   reminderPausedUntil: new Date(now.getTime() + 48 * 60 * 60 * 1000), // +48 hours
        // };

        console.log(`SEND STATEMENT to ${from} for Transaction ${transaction._id}`);

        
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



  } catch (error) {
    console.error("Error in updateTransactionStatus:", error);
  }
};