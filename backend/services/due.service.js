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

export const updateTransactionStatus = async ({ from, actionId }) => {
  console.log(`Updating Transaction Status for ${from}, Action: ${actionId}`);

  try {
    const customer = await Customer.findOne({ mobile: from });
    if (!customer) {
      console.error(`Customer not found for mobile: ${from}`);
      return;
    }

    // Find the most relevant pending transaction (DUE_ADDED)
    // We prioritize OVERDUE or PENDING/PARTIAL
    const transaction = await Transaction.findOne({
      customerId: customer._id,
      type: "DUE_ADDED",
      paymentStatus: { $in: ["PENDING", "PARTIAL", "OVERDUE"] },
    }).sort({ dueDate: 1 }); // Oldest due first? or recent? Usually we want to address the oldest due.

    if (!transaction) {
      console.log(`No pending due found for customer ${customer._id}`);
      // Maybe reply "You have no pending dues"?
      return;
    }

    const now = new Date();
    let updates = {};

    switch (actionId) {
      case "PAY_TODAY": // "I will pay today"
      case "WILL_PAY_TODAY": // "I will pay today"
        updates = {
          commitmentStatus: "COMMITTED_TODAY",
          expectedPaymentDate: now, // Set to today
          reminderPausedUntil: new Date(now.getTime() + 24 * 60 * 60 * 1000), // +24 hours
        };
        // System Actions: Pause all reminders for 24 hours.
        // Also "Set expected_payment_date = today"
        break;

      case "PAID_TODAY": // "Paid today"
        updates = {
          commitmentStatus: "PAID_AWAITING_CONFIRMATION",
          // Pause all reminders immediately (Done via reminderPausedUntil indefinitely or check commitmentStatus)
          // Let's set a long pause or handle it in reminder service to skip if status is PAID_AWAITING_CONFIRMATION
          reminderPausedUntil: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // Pause for 7 days significantly or until verified
        };
        // Notify user/account owner to verify payment
        // TODO: Implement notification
        console.log(`NOTIFY OWNER: Customer ${customer.name} claims to have paid.`);
        try {
          // Re-fetch transaction with operator populated
          const detailedTx = await Transaction.findById(transaction._id).populate("metadata.operatorId");
          const ownerMobile = detailedTx?.metadata?.operatorId?.phoneNumber;

          if (ownerMobile) {
            const message = `Action Required: Customer ${customer.name} (${customer.mobile}) has marked their due of ₹${transaction.amount} as PAID today. Please verify.`;
            // Assuming sending text message to owner. If owner is not a customer, we might need a different sending mechanism or just use sendTextMessage if the number is valid whatsapp number.
            // Usually this goes to the business owner.
            await whatsappService.sendTextMessage({ to: ownerMobile, text: message });
            console.log(`Notification sent to owner ${ownerMobile}`);
          }
        } catch (notifyErr) {
          console.error("Failed to notify owner:", notifyErr);
        }
        break;

      case "PAY_WEEK": // "I will pay within a week"
        const nextWeek = new Date(now);
        nextWeek.setDate(nextWeek.getDate() + 7);
        updates = {
          commitmentStatus: "COMMITTED_THIS_WEEK",
          expectedPaymentDate: nextWeek,
          reminderPausedUntil: nextWeek,
        };
        break;

      case "PAY_SOON": // "I will pay soon"
        updates = {
          commitmentStatus: "PAYING_SOON",
          reminderPausedUntil: new Date(now.getTime() + 72 * 60 * 60 * 1000), // +72 hours
        };
        break;

      case "NEED_STATEMENT": // "Need statement"
        updates = {
          commitmentStatus: "STATEMENT_REQUESTED",
          reminderPausedUntil: new Date(now.getTime() + 48 * 60 * 60 * 1000), // +48 hours
        };
        // Send invoice / statement automatically
        console.log(`SEND STATEMENT to ${from}`);
        await whatsappService.sendTextMessage({ to: from, text: "We have received your request for a statement. It will be sent to you shortly." });
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

    // Send confirmation or acknowledgment if needed?
    // original logic didn't specify responding back with text, but usually good practice.
    // For now we trust the flow.

  } catch (error) {
    console.error("Error in updateTransactionStatus:", error);
  }
};