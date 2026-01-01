import Customer from "../model/customer.model.js";
import Transaction from "../model/transaction.model.js";
import { APIResponse } from "../utils/ResponseAndError/ApiResponse.utils.js";
import { APIError } from "../utils/ResponseAndError/ApiError.utils.js";
import Reminder from "../model/remainder.model.js";
import reminderService from "../services/reminder.service.js";

async function recalculateDue(dueTransactionId) {
  const payments = await Transaction.find({
    linkedDueTransaction: dueTransactionId,
    type: "PAYMENT"
  });

  const paidAmount = payments.reduce((sum, p) => sum + p.amount, 0);

  const dueTx = await Transaction.findById(dueTransactionId);
  dueTx.paidAmount = paidAmount;

  if (paidAmount === 0) dueTx.paymentStatus = "PENDING";
  else if (paidAmount < dueTx.amount) dueTx.paymentStatus = "PARTIAL";
  else dueTx.paymentStatus = "PAID";

  await dueTx.save();

  if (dueTx.paymentStatus === "PAID") {
    await Reminder.updateMany(
      {
        transactionId: dueTransactionId,
        status: { $in: ["pending", "scheduled"] }
      },
      {
        $set: {
          status: "cancelled",
          cancelledAt: new Date()
        }
      },
      {}
    );
  }

  return dueTx;
}


export async function addDue(req, res) {
  const { id: customerId } = req.params;
  let { amount, note, invoiceId } = req.body;
  console.log(customerId, amount, note, invoiceId);

  try {
    amount = Number(amount);
    if (!amount || amount <= 0) {
      return new APIError(400, "Amount must be positive").send(res);
    }

    const customer = await Customer
      .findById(customerId)
      .populate("paymentTerm");

    if (!customer) {
      return new APIError(404, "Customer not found").send(res);
    }

    const creditDays = customer.paymentTerm?.creditDays ?? 0;
    console.log("creditDays",creditDays);
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + creditDays);


    const tx = await Transaction.create([{
      customerId,
      type: "DUE_ADDED",
      amount,
      paidAmount: 0,
      paymentStatus: "PENDING",
      dueDate,
      metadata: { note, invoiceId, operatorId: req.user?.id }
    }], { });

  

    const reminders= await reminderService.createForDue({ transactionId: tx[0]._id });

    customer.currentDue += amount;
    customer.lastTransaction = tx[0]._id;
    customer.status = customer.status === "Overdue" ? "Overdue" : "Due";
  await customer.save();

    return new APIResponse(201, { transaction: tx[0] }).send(res);
  } catch (err) {
    console.error("Error in addDue:", err);
    return new APIError(500, "Internal Server Error").send(res);
  }
}


export async function makePayment(req, res) {
  const { dueTransactionId } = req.body;
  let { amount, note } = req.body;
  try {
    amount = Number(amount);
    if (!amount || amount <= 0) {
      return new APIError(400, "Invalid payment amount").send(res);
    }

    const dueTx = await Transaction
      .findById(dueTransactionId)

    if (!dueTx || dueTx.type !== "DUE_ADDED") {
      return new APIError(400, "Invalid due transaction").send(res);
    }

    if (dueTx.paymentStatus === "PAID") {
      return new APIError(400, "This due is already fully paid").send(res);
    }

    const remaining = dueTx.amount - dueTx.paidAmount;
    if (amount > remaining) {
      return new APIError(400, "Payment exceeds remaining due").send(res);
    }

    // create payment FIRST
    const paymentTx = await Transaction.create([{
      customerId: dueTx.customerId,
      type: "PAYMENT",
      amount,
      linkedDueTransaction: dueTx._id,
      metadata: { note, operatorId: req.user?.id }
    }], { });

    // THEN recalculate
    const updatedDue = await recalculateDue(dueTx._id);
    
  await Customer.findByIdAndUpdate(
      dueTx.customerId,
      {
        $inc: { currentDue: -amount },
        $set: { lastTransaction: paymentTx._id }
      },
      { }
    );

    return new APIResponse(200, {
      payment: paymentTx[0],
      due: {
        ...updatedDue.toObject(),
        // remainingDue: updatedDue.amount - updatedDue.paidAmount
      }
    }).send(res);

  } catch (err) {
    console.error("Error in makePayment:", err);
    return new APIError(500, "Internal Server Error").send(res);
  }
};

export async function getTransactions(req, res) {
  const { id: customerId } = req.params;

  try {
    const dues = await Transaction.find({ customerId, type: "DUE_ADDED" })
      .sort({ createdAt: -1 });

    const dueIds = dues.map(d => d._id);

    const payments = await Transaction.find({ linkedDueTransaction: { $in: dueIds } });

    const paymentMap = {};
    for (const p of payments) {
      const key = p.linkedDueTransaction.toString();
      if (!paymentMap[key]) paymentMap[key] = [];
      paymentMap[key].push(p);
    }

    const result = dues.map(due => {
      const obj = due.toObject({ virtuals: true });
      obj.payments = paymentMap[due._id.toString()] || [];
      return obj;
    });

    return new APIResponse(200, { dues: result }).send(res);
  } catch (err) {
    console.error("Error in getTransactions:", err);
    return new APIError(500, "Internal Server Error").send(res);
  }
};



