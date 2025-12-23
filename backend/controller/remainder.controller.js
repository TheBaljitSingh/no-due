import Customer from "../model/customer.model.js";
import { APIError } from "../utils/ResponseAndError/ApiError.utils.js";
import { APIResponse } from "../utils/ResponseAndError/ApiResponse.utils.js";
import whatsappService from "../services/whatsapp.service.js";
import remainderService from "../services/reminder.service.js";
import Transaction from "../model/transaction.model.js";
import Reminder from "../model/remainder.model.js";

export const getAllRemainders = async (req, res) => {
  try {

    const { status } = req.query;

    const filters = {};
    if (status) {
      filters.status = status.toLowerCase();
    }

    console.log(filters);
    const reminders = await Reminder.find(filters)
      .populate("customerId", "name mobile currentDue")
      .populate({
        path: 'transactionId',
        select: 'amount dueDate'
      })
      .sort({ createdAt: -1 });

    return new APIResponse(200, reminders, "All reminders fetched successfully").send(res);
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
    const { templateName = "nodue_remainder_1", variables = [] } = req.body;

    // console.log("remainder tempalte name", templateName );

    if (!transactionId) {
      return new APIError(400, ["transactionId is required"], "Validation Error").send(res);
    }

    const result = await remainderService.sendNow({
      transactionId,
      templateName,
      variables
    });

    return new APIResponse(200, result, "Reminder sent successfully").send(res);
  } catch (error) {
    console.error(error);
    return new APIError(500, [error.message], "Failed to send reminder").send(res);
  }
}

export const scheduleWhatsappRemainder = async (req, res) => {
  try {
    //make sure scheduleFor data is valid
    const { transactionId, scheduledFor, variables = [] } = req.body;
    // templateName = "payment_due_today": i'm not taking templateName it will be be calculated on scheduleFor


    // console.log("remainder tempalte name", templateName );

    if (!transactionId || !scheduledFor) {
      return new APIError(400, ["transactionId and scheduledFor are required"], "Validation Error").send(res);
    }

    const reminder = await remainderService.schedule({
      transactionId,
      scheduledFor,
      variables
    });

    return new APIResponse(201, reminder, "Reminder scheduled successfully").send(res);

  } catch (error) {
    console.error(error);
    return new APIError(500, [error.message], "Failed to schedule reminder").send(res);
  }
}
