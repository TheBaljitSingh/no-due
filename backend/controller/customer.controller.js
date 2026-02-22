import Customer from "../model/customer.model.js";
import { APIError } from "../utils/ResponseAndError/ApiError.utils.js";
import { APIResponse } from "../utils/ResponseAndError/ApiResponse.utils.js";
import Transaction from "../model/transaction.model.js";
import Reminder from "../model/reminder.model.js";
import reminderService from "../services/reminder.service.js";
import { getBeforeDueTemplate, getDueTodayTemplate, getOverdueTemplate, REMINDER_TEMPLATE_NAMES } from "../utils/reminder.templates.js";
import PaymentTerm from "../model/PaymentTerm.model.js";
import User from "../model/user.model.js";


export const createCustomer = async (req, res) => {
  try {
    const customerData = req.body;
    if (!customerData) {
      return new APIResponse(400, null, "Data is required").send(res);
    }

    const userId = req.user._id;

    // Get default payment term
    const defaultPT = await PaymentTerm.findOne({
      owner: null,
      isDefault: true,
      isActive: true
    }).sort({ createdAt: -1 });

    console.log(defaultPT);

    // ---------- BULK UPLOAD ----------
    if (Array.isArray(customerData)) {
      let createdCount = 0;
      let updatedCount = 0;
      const results = [];

      for (const customer of customerData) {
        const mobile = customer.mobile?.toString().replace(/\D/g, "");
        const formattedMobile = mobile.startsWith("91") ? mobile : `91${mobile}`;

        const dueAmount = Number(customer.amount) || 0;
        const status = (customer?.status).toLowerCase();

        console.log("status", status);

        //this will store info of payment term - have to check 
        const paymentTermData = customer.paymentTerm
          ? await PaymentTerm.findById(customer.paymentTerm)
          : defaultPT; // have to take default payment term if not provided

        const creditDays =
          paymentTermData?.creditDays ??
          defaultPT?.creditDays ??
          10;

        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + creditDays);

        let existingCustomer = await Customer.findOne({
          mobile: formattedMobile,
          CustomerOfComapny: userId,
          paymentTerm: paymentTermData?._id
        });

        // ================= EXISTING CUSTOMER =================
        if (existingCustomer) {
          updatedCount++;

          console.log("dueAmount", dueAmount);

          if (dueAmount > 0) {
            let transaction;

            // ----------- PAID CASE -----------
            if (status === "paid") {
              transaction = await Transaction.create({
                customerId: existingCustomer._id,
                type: "PAYMENT",
                amount: dueAmount,
                paymentStatus: "PAID",
                metadata: {
                  note: customer.note || "Bulk upload payment",
                  operatorId: userId
                }
              });
              console.log("Transaction created:", transaction);

              existingCustomer.status = "Paid";
            }

            // ----------- DUE / OVERDUE CASE -----------
            else {
              const paymentStatus =
                status === "overdue" ? "OVERDUE" : "PENDING"; //pending for due

              transaction = await Transaction.create({
                customerId: existingCustomer._id,
                type: "DUE_ADDED",
                amount: dueAmount,
                paidAmount: 0,
                paymentStatus,
                dueDate,
                metadata: {
                  note: customer.note || "Bulk upload due addition",
                  operatorId: userId
                }
              });
              console.log("Transaction created:", transaction);

              existingCustomer.currentDue += dueAmount;
              existingCustomer.status =
                status === "overdue" ? "Overdue" : "Due";

              // ----------- CREATE REMINDERS -----------
              const offsets =
                paymentTermData?.reminderOffsets ??
                defaultPT?.reminderOffsets ??
                [];

              const userDoc = await User.findById(userId);
              const companyName = userDoc?.companyName;

              const effectiveOffsets = [...offsets];
              if (status === "overdue" && !effectiveOffsets.some(o => o < 0)) {
                effectiveOffsets.push(-1);
              }

              for (const offset of effectiveOffsets) {
                const scheduledDate = new Date(dueDate);
                scheduledDate.setDate(scheduledDate.getDate() - offset);

                let reminderType = "before_due";
                if (offset === 0) reminderType = "due_today";
                if (offset < 0) reminderType = "after_due";

                // If overdue → only after_due reminders
                if (status === "overdue" && reminderType !== "after_due")
                  continue;

                if (scheduledDate < new Date()) {
                  scheduledDate.setTime(new Date().getTime() + 1000 * 60 * 5);
                }

                if (scheduledDate >= new Date()) {
                  try {
                    let templatePayload;

                    if (reminderType === "before_due") {
                      templatePayload = await getBeforeDueTemplate(
                        existingCustomer.name,
                        dueAmount,
                        dueDate,
                        companyName,
                        userId
                      );
                    } else if (reminderType === "due_today") {
                      templatePayload = await getDueTodayTemplate(
                        existingCustomer.name,
                        dueAmount,
                        dueDate,
                        companyName,
                        userId
                      );
                    } else {
                      templatePayload = await getOverdueTemplate(
                        existingCustomer.name,
                        dueAmount,
                        dueDate,
                        companyName,
                        userId
                      );
                    }

                    const remindercreated = await Reminder.create({
                      customerId: existingCustomer._id,
                      transactionId: transaction._id,
                      reminderType,
                      scheduledFor: scheduledDate,
                      whatsappTemplate: {
                        name: templatePayload?.templateName,
                        language: templatePayload?.language
                      },
                      templateVariables: [
                        existingCustomer.name,
                        dueAmount.toString(),
                        dueDate.toDateString()
                      ],
                      source: "auto"
                    });
                    console.log("Reminder created:", remindercreated);
                  } catch (er) { console.log("Error creating reminder", er); }
                }
              }
            }

            existingCustomer.lastTransaction = transaction._id;
            await existingCustomer.save();
          }

          results.push(existingCustomer);
        }

        // ================= NEW CUSTOMER =================
        else {
          const newCustomer = await Customer.create({
            ...customer,
            mobile: formattedMobile,
            CustomerOfComapny: userId,
            currentDue: 0,
            paymentTerm: paymentTermData?._id
          });

          createdCount++;

          if (dueAmount > 0) {
            let transaction;

            if (status === "paid") {
              transaction = await Transaction.create({
                customerId: newCustomer._id,
                type: "PAYMENT",
                amount: dueAmount,
                paymentStatus: "PAID",
                metadata: {
                  note: customer.note || "Initial payment",
                  operatorId: userId
                }
              });
              console.log("Transaction created:", transaction);

              newCustomer.status = "Paid";
            } else {
              const paymentStatus =
                status === "overdue" ? "OVERDUE" : "PENDING";

              transaction = await Transaction.create({
                customerId: newCustomer._id,
                type: "DUE_ADDED",
                amount: dueAmount,
                paidAmount: 0,
                paymentStatus,
                dueDate,
                metadata: {
                  note: customer.note || "Initial due",
                  operatorId: userId
                }
              });
              console.log("Transaction created:", transaction);

              newCustomer.currentDue = dueAmount;
              newCustomer.status =
                status === "overdue" ? "Overdue" : "Due";

              // ----------- CREATE REMINDERS -----------
              const offsets =
                paymentTermData?.reminderOffsets ??
                defaultPT?.reminderOffsets ??
                [];

              const userDoc = await User.findById(userId);
              const companyName = userDoc?.companyName;

              const effectiveOffsets = [...offsets];
              if (status === "overdue" && !effectiveOffsets.some(o => o < 0)) {
                effectiveOffsets.push(-1);
              }

              for (const offset of effectiveOffsets) {
                const scheduledDate = new Date(dueDate);
                scheduledDate.setDate(scheduledDate.getDate() - offset);

                let reminderType = "before_due";
                if (offset === 0) reminderType = "due_today";
                if (offset < 0) reminderType = "after_due";

                if (status === "overdue" && reminderType !== "after_due")
                  continue;

                if (scheduledDate < new Date()) {
                  scheduledDate.setTime(new Date().getTime() + 1000 * 60 * 5);
                }

                if (scheduledDate >= new Date()) {
                  try {
                    let templatePayload;

                    if (reminderType === "before_due") {
                      templatePayload = await getBeforeDueTemplate(
                        newCustomer.name,
                        dueAmount,
                        dueDate,
                        companyName,
                        userId
                      );
                    } else if (reminderType === "due_today") {
                      templatePayload = await getDueTodayTemplate(
                        newCustomer.name,
                        dueAmount,
                        dueDate,
                        companyName,
                        userId
                      );
                    } else {
                      templatePayload = await getOverdueTemplate(
                        newCustomer.name,
                        dueAmount,
                        dueDate,
                        companyName,
                        userId
                      );
                    }

                    const remindercreated = await Reminder.create({
                      customerId: newCustomer._id,
                      transactionId: transaction._id,
                      reminderType,
                      scheduledFor: scheduledDate,
                      whatsappTemplate: {
                        name: templatePayload?.templateName,
                        language: templatePayload?.language
                      },
                      templateVariables: [
                        newCustomer.name,
                        dueAmount.toString(),
                        dueDate.toDateString()
                      ],
                      source: "auto"
                    });
                    console.log("Reminder created:", remindercreated);
                  } catch (er) { console.log("Error creating reminder", er); }
                }
              }
            }

            newCustomer.lastTransaction = transaction._id;
            await newCustomer.save();
          }

          results.push(newCustomer);
        }
      }

      return new APIResponse(
        201,
        {
          customers: results,
          summary: {
            total: customerData.length,
            created: createdCount,
            updated: updatedCount
          }
        },
        "Bulk upload completed successfully"
      ).send(res);
    }

    // -------- SINGLE CUSTOMER --------
    // -------- SINGLE CUSTOMER --------
    const mobile = customerData.mobile?.toString().replace(/\D/g, "");
    const formattedMobile = mobile.startsWith("91") ? mobile : `91${mobile}`;

    const dueAmount = Number(customerData.amount) || 0;
    const status = (customerData?.status || "").toLowerCase().trim();

    const paymentTermData = customerData.paymentTerm
      ? await PaymentTerm.findById(customerData.paymentTerm)
      : null;

    const creditDays =
      paymentTermData?.creditDays ??
      defaultPT?.creditDays ??
      10;

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + creditDays);

    const newCustomer = await Customer.create({
      ...customerData,
      mobile: formattedMobile,
      CustomerOfComapny: userId,
      currentDue: 0
    });

    let transaction = null;

    if (dueAmount > 0) {
      if (status === "paid") {
        transaction = await Transaction.create({
          customerId: newCustomer._id,
          type: "PAYMENT",
          amount: dueAmount,
          paymentStatus: "PAID",
          metadata: {
            note: customerData.note || "Initial payment",
            operatorId: userId
          }
        });

        newCustomer.status = "Paid";
      } else {
        // DUE or OVERDUE
        let paymentStatus = "PENDING";
        if (status === "overdue") {
          paymentStatus = "OVERDUE";
        }

        transaction = await Transaction.create({
          customerId: newCustomer._id,
          type: "DUE_ADDED",
          amount: dueAmount,
          paidAmount: 0,
          paymentStatus,
          dueDate,
          metadata: {
            note: customerData.note || "Initial due",
            operatorId: userId
          }
        });

        newCustomer.currentDue = dueAmount;
        newCustomer.status =
          status === "overdue" ? "Overdue" : "Due";

        // ================= CREATE REMINDERS =================
        const offsets =
          paymentTermData?.reminderOffsets ??
          defaultPT?.reminderOffsets ??
          [];

        const userDoc = await User.findById(userId);
        const companyName = userDoc?.companyName;

        const effectiveOffsets = [...offsets];
        if (status === "overdue" && !effectiveOffsets.some(o => o < 0)) {
          effectiveOffsets.push(-1);
        }

        for (const offset of effectiveOffsets) {
          const scheduledDate = new Date(dueDate);
          scheduledDate.setDate(scheduledDate.getDate() - offset);

          let reminderType = "before_due";
          if (offset === 0) reminderType = "due_today";
          if (offset < 0) reminderType = "after_due";

          // If overdue → only after_due reminders
          if (status === "overdue" && reminderType !== "after_due")
            continue;

          if (scheduledDate < new Date()) {
            scheduledDate.setTime(new Date().getTime() + 1000 * 60 * 5);
          }

          if (scheduledDate >= new Date()) {
            try {
              let templatePayload;

              if (reminderType === "before_due") {
                templatePayload = await getBeforeDueTemplate(
                  newCustomer.name,
                  dueAmount,
                  dueDate,
                  companyName,
                  userId
                );
              } else if (reminderType === "due_today") {
                templatePayload = await getDueTodayTemplate(
                  newCustomer.name,
                  dueAmount,
                  dueDate,
                  companyName,
                  userId
                );
              } else {
                templatePayload = await getOverdueTemplate(
                  newCustomer.name,
                  dueAmount,
                  dueDate,
                  companyName,
                  userId
                );
              }

              const remindercreated = await Reminder.create({
                customerId: newCustomer._id,
                transactionId: transaction._id,
                reminderType,
                scheduledFor: scheduledDate,
                whatsappTemplate: {
                  name: templatePayload?.templateName,
                  language: templatePayload?.language
                },
                templateVariables: [
                  newCustomer.name,
                  dueAmount.toString(),
                  dueDate.toDateString()
                ],
                source: "auto"
              });
              console.log("Reminder created:", remindercreated);
            } catch (e) {
              console.log("Error creating reminder", e);
            }
          }
        }
      }

      newCustomer.lastTransaction = transaction._id;
      await newCustomer.save();
    }

    return new APIResponse(
      201,
      newCustomer,
      "Customer created successfully"
    ).send(res);

  } catch (error) {
    console.error(error);

    if (error.name === "ValidationError") {
      const errors = {};
      Object.keys(error.errors).forEach((field) => {
        errors[field] = error.errors[field].message;
      });
      return new APIError(400, errors, "Validation Failed").send(res);
    }

    return new APIError(500, error.message).send(res);
  }
};



export const getCustomers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "" } = req.query;
    const offset = (page - 1) * limit;
    const queryLimit = limit === "all" ? 0 : parseInt(limit);

    const userId = req.user._id;

    const query = { CustomerOfComapny: userId };

    // If a search term is provided, filter by name or mobile (case-insensitive)
    if (search && search.trim() !== "") {
      const regex = new RegExp(search.trim(), "i"); //case insensitive
      query.$or = [{ name: regex }, { mobile: regex }];
    }

    const customers = await Customer.find(query)
      .populate("lastTransaction", "commitmentStatus")
      .populate("paymentTerm", "name")
      .skip(offset)
      .limit(queryLimit);

    const total = await Customer.countDocuments(query);
    return new APIResponse(200, { customers, total, page, limit, totalPages: Math.ceil(total / limit) }, "Fetched all customers").send(res);

  } catch (error) {
    return new APIError(500, error, "Failed to fetch the customers data").send(res);
  }
}

//api/v1/customer/?CId_004
//doubt: for customer there is _id and CustomerId do i need here boolean check
export const getCustomersById = async (req, res) => {
  try {
    //only users's customer should be queried
    const { customerId } = req.params;
    const userId = req.user._id;

    const customer = await Customer.findOne({ _id: customerId, CustomerOfComapny: userId });
    if (!customer) {
      return new APIResponse(404, null, `No customer found for this Id ${customerId}`).send(res);
    }

    return new APIResponse(200, customer, "Customer found",).send(res);


  } catch (error) {

    return new APIError(500, error, "Failed to get Customer by given CustomerId",).send(res);
  }
}

export const updateCustomer = async (req, res) => {
  try {
    const { customerId } = req.params;
    const userId = req.user._id;
    const updatedData = req.body;
    if (!updatedData) {
      return new APIResponse(400, null, `No data provided to update`).send(res);
    }
    const filters = {};
    filters.CustomerOfComapny = userId;
    filters._id = customerId;

    const response = await Customer.findOneAndUpdate(filters, updatedData, { new: true });
    return new APIResponse(200, response, "Successfully updated").send(res);

  } catch (error) {
    return new APIError(500, error, "Failed to Update Customer",).send(res);

  }
}

export const deleteCustomers = async (req, res) => {
  try {
    const { customerId } = req.params;
    const userId = req.user._id;

    const customer = await Customer.findOne({ _id: customerId, CustomerOfComapny: userId });

    if (!customer) {
      return new APIResponse(404, null, "Customer not found").send(res);
    }

    const result = await Customer.deleteOne({ _id: customerId, CustomerOfComapny: userId });

    return new APIResponse(200, result, `Customer with this Id: ${customerId} is deleted`,).send(res);


  } catch (error) {
    console.log(error);
    return new APIError(500, error, "Failed to delete customer").send(res);

  }
}