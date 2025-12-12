import Customer from "../model/customer.model.js";
import Transaction from "../model/transaction.model.js";
import { APIResponse } from "../utils/ResponseAndError/ApiResponse.utils.js";
import { APIError } from "../utils/ResponseAndError/ApiError.utils.js";

function calculateCustomerStatus(currentDue, lastDueDate) {
    if (currentDue === 0) return "Paid";

    const now = new Date();
    const diffDays = (now - new Date(lastDueDate)) / (1000 * 60 * 60 * 24);

    //here given teh 30 days time to complete the payment
    if (diffDays > 30) return "Overdue";   
    if (diffDays <= 1) return "Pending";

    return "Due";
}



export async function addDue(req, res) {
  const { id: customerId } = req.params;
  let { amount, note, invoiceId } = req.body;

  amount = Number(amount);

  if (!amount || amount <= 0) {
    return new APIError(400, "Amount must be a positive number").send(res);
  }

  try {
   

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return new APIError(404, "Customer not found").send(res);
    }

    const previousDue = Number(customer.currentDue || 0);
    const newDue = previousDue + amount;

    const tx = await Transaction.create({
      customerId,
      type: "DUE_ADDED",
      amount: amount,
      previousDue,
      newDue,
      metadata: { note, invoiceId, operatorId: req.user?.id || null }
    });

    const status = calculateCustomerStatus(newDue, tx.createdAt);

    customer.currentDue = newDue;
    customer.lastTransaction = tx._id;
    customer.status = status;
    await customer.save();

    return new APIResponse(201, { transaction: tx, currentDue: newDue, status }).send(res);
  } catch (err) {
    console.error("Error in addDue:", err);  
    return new APIError(500, "Internal Server Error").send  (res);
  }
}

export async function makePayment(req, res) {
  const { id: customerId } = req.params;
  let { amount, note, paymentMethod } = req.body;

  amount = Number(amount);
  if (!amount || amount <= 0) {
    return new APIError(400, "Payment amount must be a positive number").send(res);
  }

  try {
   
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return new APIError(404, "Customer not found").send(res);
    }

    const previousDue = Number(customer.currentDue || 0);
    const newDue = previousDue - amount;
    const finalNewDue = newDue;

    const [tx] = await Transaction.create([{
      customerId,
      type: "PAYMENT",
      amount: amount,
      previousDue,
      newDue: finalNewDue,
      metadata: { note, paymentMethod, operatorId: req.user?.id || null }
    }],);

    const status = calculateCustomerStatus(finalNewDue, tx.createdAt);

    customer.currentDue = finalNewDue;
    customer.lastTransaction = tx._id;
    customer.status = status;
    await customer.save();
  

    return new APIResponse(201, { transaction: tx, currentDue: finalNewDue, status }).send(res);
  } catch (err) {
    console.error("Error in makePayment:", err);  
    return new APIError(500, "Internal Server Error").send(res);
  
  }
}

export async function editDue(req, res) {
  const { id: customerId } = req.params;
  let { correctedDue, note } = req.body;

  correctedDue = Number(correctedDue);
  if (correctedDue === undefined || correctedDue === null || isNaN(correctedDue)) {
    return new APIError(400, "correctedDue must be a valid number").send(res);
  }

  try {


    const customer = await Customer.findById(customerId);
    if (!customer) {
      return new APIError(404, "Customer not found").send(res);
    }

    const previousDue = Number(customer.currentDue || 0);
    const newDue = correctedDue;

    const [tx] = await Transaction.create([{
      customerId,
      type: "DUE_EDITED",
      amount: Math.abs(newDue - previousDue),
      previousDue,
      newDue,
      metadata: { note, operatorId: req.user?.id || null }
    }]);

    const status = calculateCustomerStatus(newDue, tx.createdAt);

    customer.status = status;
    customer.currentDue = newDue;
    customer.lastTransaction = tx._id;
    await customer.save();
 

    return new APIResponse(200, { transaction: tx, currentDue: newDue }).send(res);
  } catch (err) {
    
    console.error("Error in editDue:", err);  
    return new APIError(500, "Internal Server Error").send(res);
  }
}

export async function getTransactions(req, res, next) {
  const { id: customerId } = req.params;
  const { limit = 50, page = 1 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  try {
    const txs = await Transaction.find({ customerId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean();

    const total = await Transaction.countDocuments({ customerId });

    return new APIResponse(200, { transactions: txs, total, page: Number(page) }).send(res);
  } catch (err) {
    console.error("Error in getTransactions:", err);  
    return new APIError(500, "Internal Server Error").send(res);
  }
}


