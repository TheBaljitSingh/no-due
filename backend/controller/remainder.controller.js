import Customer from "../model/customer.model.js";
import { APIError } from "../utils/ResponseAndError/ApiError.utils.js";
import { APIResponse } from "../utils/ResponseAndError/ApiResponse.utils.js";
import whatsappService from "../services/whatsapp.service.js";
import remainderService from "../services/reminder.service.js";
import Transaction from "../model/transaction.model.js";
import Reminder from "../model/remainder.model.js";
import { formatDate } from "../utils/Helper.js"
import PaymentTerm from "../model/PaymentTerm.model.js";
import mongoose from "mongoose";



const TEMPLATE_MAP = { due_before: "nodue_remainder_1" };


function getReminderType(dueDate, scheduleFor) {
  return 'due_before';
}

export const getAllRemainders = async (req, res) => {
  try {

    const { status, page = 1, limit = 10 } = req.query;

    const filters = {};
    if (status) {
      filters.status = status.toLowerCase();
    }

    const skip = (page - 1) * limit;

    const reminders = await Reminder.find(filters)
      .populate("customerId", "name mobile currentDue")
      .populate({
        path: 'transactionId',
        select: 'amount dueDate'
      })
      .sort({ createdAt: -1 })
      .skip(Number(skip))
      .limit(Number(limit));

    const total = await Reminder.countDocuments(filters);

    return new APIResponse(200, { data: reminders, meta: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / limit) } }, "All reminders fetched successfully").send(res);
  } catch (error) {
    return new APIError(500, [error.message], "Failed to fetch reminders").send(res);
  }
}

export const createReminder = async (req, res) => {
  const { transactionId } = req.body;

  if (!transactionId) {
    return new APIError(400, ["transactionId is required"], "transactionId is required").send(res);
  }

  try {
    const reminder = await remainderService.createForDue({ transactionId });
    return new APIResponse(201, reminder, "Reminder created successfully").send(res);
  } catch (error) {
    return new APIError(500, [error.message], "Failed to create reminder").send(res);
  }
};

export const sendWhatsappRemainder = async (req, res) => {
  try {
    const { transactionId } = req.body;

    if (!transactionId) {
      return new APIError(
        400,
        ["transactionId is required"],
        "Validation Error"
      ).send(res);
    }


    const tx = await Transaction
      .findById(transactionId)
      .populate({
        path: "customerId",
        populate: { path: "paymentTerm" }
      });

    if (!tx) {
      return new APIError(404, ["Transaction not found"]).send(res);
    }

    const customer = tx.customerId;
    const paymentTerm = customer?.paymentTerm;

    if (!paymentTerm) {
      return new APIError(400, ["Payment term not found for customer"]).send(res);
    }

    const dueDate = new Date(tx.createdAt);
    dueDate.setDate(dueDate.getDate() + paymentTerm.creditDays);

    const reminderType = getReminderType(dueDate, new Date());

    const templateName = TEMPLATE_MAP[reminderType];

    if (!templateName) {
      return new APIError(
        400,
        ["No WhatsApp template mapped for reminder type"]
      ).send(res);
    }

    const variables = [
      customer.name,
      tx.amount.toString(),
      formatDate(dueDate)
    ];

    const result = await remainderService.sendNow({
      transactionId: tx._id,
      templateName,
      variables
    });

    return new APIResponse(
      200,
      result,
      "Reminder sent successfully"
    ).send(res);

  } catch (error) {
    console.error(error);
    return new APIError(
      500,
      [error.message],
      "Failed to send reminder"
    ).send(res);
  }
};

export const scheduleWhatsappRemainder = async (req, res) => {
  try {
    //make sure scheduleFor data is valid
    const { transactionId, scheduledFor } = req.body;

    if (!transactionId || !scheduledFor) {
      return new APIError(400, ["transactionId and scheduledFor are required"], "Validation Error").send(res);
    }

    const reminder = await remainderService.scheduleByUser({
      transactionId,
      scheduledFor
    });

    return new APIResponse(201, reminder, "Reminder scheduled successfully").send(res);

  } catch (error) {
    console.error(error);
    return new APIError(500, [error.message], "Failed to schedule reminder").send(res);
  }
}

export const getCustomerReminderHistory = async (req, res) => {
  try {
    const { customerId } = req.params;

    if (!customerId) {
      return new APIResponse(400, [], "customerId is required").send(res);
    }

    const customerObjectId = new mongoose.Types.ObjectId(customerId);

    const data = await Reminder.aggregate([
      {
        $match: { customerId: customerObjectId }
      },

      {
        $facet: {
          summary: [
            {
              $group: {
                _id: null,
                totalReminders: { $sum: 1 },
                totalPending: {
                  $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] }
                },
                totalSent: {
                  $sum: { $cond: [{ $eq: ["$status", "sent"] }, 1, 0] }
                },
                totalFailed: {
                  $sum: { $cond: [{ $eq: ["$status", "failed"] }, 1, 0] }
                }
              }
            }
          ],

          history: [
            {
              $project: {
                _id: 1,
                channel: 1,
                status: 1,
                templateName: 1,
                sentAt: 1,
                createdAt: 1
              }
            },
            { $sort: { createdAt: -1 } }
          ]
        }
      }
    ]);

    return new APIResponse(200, data[0], "Customer reminder history fetched", true).send(res);

  } catch (error) {
    console.error(error);
    return new APIResponse(500, [], "Internal server error").send(res);
  }
};

export const deleteReminder = async (req, res) => {
  try {
    const { remainderId } = req.params;

    if (!remainderId) {
      return new APIResponse(400, null, "Reminder ID is required", false).send(res);
    }

    const result = await Reminder.deleteOne({ _id: remainderId });

    if (result.deletedCount === 0) {
      return new APIResponse(404, null, "Reminder not found", false).send(res);
    }

    return new APIResponse(200, result, "Reminder deleted successfully", true).send(res);

  } catch (error) {
    console.error("Delete Reminder Error:", error);

    return new APIError(500, null, "Internal server error", false).send(res);
  }
};

export const rescheduleReminder = async (req, res) => {
  try {
    const { remainderId } = req.params;
    const { scheduledFor } = req.body;

    if (!remainderId || !scheduledFor) {
      return new APIResponse(400, null, "Reminder ID and next date are required", false).send(res);
    }

    const result = await remainderService.rescheduleReminder({
      reminderId: remainderId,
      scheduledFor
    });

    return new APIResponse(200, result, "Reminder rescheduled successfully", true).send(res);

  } catch (error) {
    console.error("Reschedule Reminder Error:", error);
    return new APIError(500, null, error.message || "Internal server error", false).send(res);
  }
};
