import Customer from "../model/customer.model.js";
import Transaction from "../model/transaction.model.js";
import { APIResponse } from "../utils/ResponseAndError/ApiResponse.utils.js";
import { APIError } from "../utils/ResponseAndError/ApiError.utils.js";
import mongoose from "mongoose";
import Reminder from "../model/remainder.model.js";
import reminderService from "../services/reminder.service.js";

async function recalculateDue(dueTransactionId, session) {
  const payments = await Transaction.find({
    linkedDueTransaction: dueTransactionId,
    type: "PAYMENT"
  }).session(session);

  const paidAmount = payments.reduce((sum, p) => sum + p.amount, 0);

  const dueTx = await Transaction.findById(dueTransactionId).session(session);

  dueTx.paidAmount = paidAmount;

  if (paidAmount === 0) dueTx.paymentStatus = "PENDING";
  else if (paidAmount < dueTx.amount) dueTx.paymentStatus = "PARTIAL";
  else dueTx.paymentStatus = "PAID";

  await dueTx.save({ session });

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
      { session }
    );
  }

  return dueTx;
}


export async function addDue(req, res) {
  const { id: customerId } = req.params;
  let { amount, note, invoiceId } = req.body;

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
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + creditDays);

    const session = await mongoose.startSession();
session.startTransaction();


    const tx = await Transaction.create({
      customerId,
      type: "DUE_ADDED",
      amount,
      paidAmount: 0,
      paymentStatus: "PENDING",
      dueDate,
      metadata: { note, invoiceId, operatorId: req.user?.id }
    });

    await reminderService.createForDue({ transactionId: tx._id });

    await session.commitTransaction();

    return new APIResponse(201, { transaction: tx }).send(res);
  } catch (err) {
    console.error("Error in addDue:", err);
    return new APIError(500, "Internal Server Error").send(res);
  }
}


export async function makePayment(req, res) {
  const { dueTransactionId } = req.body;
  let { amount, note } = req.body;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    amount = Number(amount);
    if (!amount || amount <= 0) {
      return new APIError(400, "Invalid payment amount").send(res);
    }

    const dueTx = await Transaction
      .findById(dueTransactionId)
      .session(session);

    if (!dueTx || dueTx.type !== "DUE_ADDED") {
      await session.abortTransaction();
      return new APIError(400, "Invalid due transaction").send(res);
    }

    if (dueTx.paymentStatus === "PAID") {
      await session.abortTransaction();
      return new APIError(400, "This due is already fully paid").send(res);
    }

    const remaining = dueTx.amount - dueTx.paidAmount;
    if (amount > remaining) {
      await session.abortTransaction();
      return new APIError(400, "Payment exceeds remaining due").send(res);
    }

    // create payment FIRST
    const paymentTx = await Transaction.create([{
      customerId: dueTx.customerId,
      type: "PAYMENT",
      amount,
      linkedDueTransaction: dueTx._id,
      metadata: { note, operatorId: req.user?.id }
    }], { session });

    // THEN recalculate
    const updatedDue = await recalculateDue(dueTx._id, session);


    await session.commitTransaction();

    return new APIResponse(200, {
      payment: paymentTx[0],
      due: {
        ...updatedDue.toObject(),
        // remainingDue: updatedDue.amount - updatedDue.paidAmount
      }
    }).send(res);

  } catch (err) {
    await session.abortTransaction();
    console.error("Error in makePayment:", err);
    return new APIError(500, "Internal Server Error").send(res);
  } finally {
    session.endSession();
  }
};

export async function getTransactions(req, res) {
  const { id: customerId } = req.params;

  try {
    const dues = await Transaction.find({
      customerId,
      type: "DUE_ADDED"
    })
      .sort({ createdAt: -1 })
      .lean();

    const dueIds = dues.map(d => d._id);

    const payments = await Transaction.find({
      linkedDueTransaction: { $in: dueIds }
    }).lean();

    const paymentMap = {};
    for (const p of payments) {
      const key = p.linkedDueTransaction.toString();
      if (!paymentMap[key]) paymentMap[key] = [];
      paymentMap[key].push(p);
    }

    const result = dues.map(due => ({
      ...due,
      payments: paymentMap[due._id.toString()] || []
    }));

    return new APIResponse(200, { dues: result }).send(res);

  } catch (err) {
    console.error("Error in getTransactions:", err);
    return new APIError(500, "Internal Server Error").send(res);
  }
}



