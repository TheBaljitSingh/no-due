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
import { REMINDER_TEMPLATE_NAMES } from "../utils/reminder.templates.js";


const TEMPLATE_MAP = {
  due_before: REMINDER_TEMPLATE_NAMES.INTERACTIVE_BEFORE_DUE,
  due_today: REMINDER_TEMPLATE_NAMES.INTERACTIVE_DUE_TODAY,
  overdue: REMINDER_TEMPLATE_NAMES.INTERACTIVE_OVERDUE,
};


export function getReminderType(dueDate, now) {
  const dDate = new Date(dueDate);
  dDate.setHours(0, 0, 0, 0);
  const nDate = new Date(now);
  nDate.setHours(0, 0, 0, 0);

  if (nDate.getTime() === dDate.getTime()) {
    return 'due_today';
  } else if (nDate > dDate) {
    return 'overdue';
  }
  return 'due_before';
}

export const getAllRemainders = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const userId = req.user._id;

    // 1. Find all customers belonging to this user
    const userCustomers = await Customer.find({ CustomerOfComapny: userId }).select('_id');
    const customerIds = userCustomers.map(c => c._id);

    // 2. Base filter: Must belong to one of the user's customers
    const filters = {
      customerId: { $in: customerIds }
    };

    if (status) {
      const statuses = status.split(',').map(s => s.trim().toLowerCase());
      if (statuses.length > 1) {
        filters.status = { $in: statuses };
      } else {
        filters.status = statuses[0];
      }
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

    // 3. Stats Aggregation (Scoped to user's customers)
    const statsAggregation = await Reminder.aggregate([
      {
        $match: { customerId: { $in: customerIds } }
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          pending: {
            $sum: {
              $cond: [
                { $in: ["$status", ["pending", "rescheduled"]] },
                1,
                0
              ]
            }
          },
          sent: { $sum: { $cond: [{ $eq: ["$status", "sent"] }, 1, 0] } },
          failed: { $sum: { $cond: [{ $eq: ["$status", "failed"] }, 1, 0] } },
          scheduled: { $sum: { $cond: [{ $eq: ["$status", "scheduled"] }, 1, 0] } }
        }
      },
      {
        $project: {
          _id: 0, total: 1, pending: 1, sent: 1, failed: 1, scheduled: 1
        }
      }
    ]);

    const stats = statsAggregation[0] || { total: 0, pending: 0, sent: 0, failed: 0, scheduled: 0 };

    return new APIResponse(200, {
      data: reminders,
      meta: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / limit) },
      stats
    }, "All reminders fetched successfully").send(res);

  } catch (error) {
    console.error("Fetch Reminders Error:", error);
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
    // We can use paymentTerm to calculate due date OR use tx.dueDate if available
    let dueDate = tx.dueDate;
    if (!dueDate && customer?.paymentTerm) {
      dueDate = new Date(tx.createdAt);
      dueDate.setDate(dueDate.getDate() + customer.paymentTerm.creditDays);
    }

    if (!dueDate) {
      // Fallback or error? defaulting to today for safety or erroring
      dueDate = new Date(); // unsafe assumption but prevents crash
    }


    const reminderType = getReminderType(dueDate, new Date());

    const templateName = TEMPLATE_MAP[reminderType];

    if (!templateName) {
      return new APIError(
        400,
        ["No WhatsApp template mapped for reminder type"]
      ).send(res);
    }

    console.log("templateName: ", templateName, "\n");

    const variables = [
      customer.name,
      tx.amount.toString(),
      dueDate // Pass Date object, service formats it
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

    return new APIResponse(500, null, "Internal server error", false).send(res);
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

import WhatsappMessage from "../model/whatsappMessage.modal.js";

export const getAuditLogs = async (req, res) => {
  try {
    const { mobile } = req.params;
    if (!mobile) {
      return new APIError(400, null, "Mobile number is required").send(res);
    }

    const logs = await WhatsappMessage.find({ mobile })
      .sort({ timestamp: -1 }) // Newest first
      .limit(50); // Limit to last 50 for now

    return new APIResponse(200, logs, "Audit logs fetched").send(res);
  } catch (error) {
    console.error("Get Audit Logs Error:", error);
    return new APIError(500, null, "Failed to fetch audit logs").send(res);
  }
};