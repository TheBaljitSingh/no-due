import Customer from "../model/customer.model.js";
import { APIError } from "../utils/ResponseAndError/ApiError.utils.js";
import { APIResponse } from "../utils/ResponseAndError/ApiResponse.utils.js";
import Transaction from "../model/transaction.model.js";
import Reminder from "../model/reminder.model.js";
import reminderService from "../services/reminder.service.js";
import {
  getBeforeDueTemplate,
  getDueTodayTemplate,
  getOverdueTemplate,
  REMINDER_TEMPLATE_NAMES,
} from "../utils/reminder.templates.js";
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
      isActive: true,
    }).sort({ createdAt: -1 }).select("creditDays reminderOffsets").lean();

    // console.log(defaultPT);

    // ---------- BULK UPLOAD ----------
    if (Array.isArray(customerData)) {
      let createdCount = 0;
      let updatedCount = 0;
      const results = [];

      for (const customer of customerData) {
        const mobile = customer.mobile?.toString().replace(/\D/g, "");
        const formattedMobile =
          mobile.length === 12 && mobile.startsWith("91")
            ? mobile
            : `91${mobile}`;

        const dueAmount = Number(customer.amount) || 0;
        const status = (customer?.status).toLowerCase();

        // console.log("status", status);

        //this will store info of payment term - have to check
        const paymentTermData = customer.paymentTerm
          ? await PaymentTerm.findById(customer.paymentTerm).select("creditDays reminderOffsets").lean()
          : defaultPT; // have to take default payment term if not provided

        const creditDays =
          paymentTermData?.creditDays ?? defaultPT?.creditDays;

        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + creditDays);

        let existingCustomer = await Customer.findOne({
          mobile: formattedMobile,
          CustomerOfComapny: userId,
          paymentTerm: paymentTermData?._id,
        }).select("name lastTransaction status currentDue").populate({
          path: "CustomerOfComapny",
          select: "companyName"
        }).lean();

        console.log("existing customer", existingCustomer);


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
                  operatorId: userId,
                },
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
                  operatorId: userId,
                },
              });
              // console.log("Transaction created:", transaction);

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
              if (
                status === "overdue" &&
                !effectiveOffsets.some((o) => o < 0)
              ) {
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
                        userId,
                      );
                    } else if (reminderType === "due_today") {
                      templatePayload = await getDueTodayTemplate(
                        existingCustomer.name,
                        dueAmount,
                        dueDate,
                        companyName,
                        userId,
                      );
                    } else {
                      templatePayload = await getOverdueTemplate(
                        existingCustomer.name,
                        dueAmount,
                        dueDate,
                        companyName,
                        userId,
                      );
                    }

                    const remindercreated = await Reminder.create({
                      customerId: existingCustomer._id,
                      transactionId: transaction._id,
                      reminderType,
                      scheduledFor: scheduledDate,
                      whatsappTemplate: {
                        name: templatePayload?.templateName,
                        language: templatePayload?.language,
                      },
                      templateVariables: [
                        existingCustomer.name,
                        dueAmount.toString(),
                        dueDate.toDateString(),
                      ],
                      source: "auto",
                    });
                    console.log("Reminder created:", remindercreated);
                  } catch (er) {
                    console.log("Error creating reminder", er);
                  }
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
            paymentTerm: paymentTermData?._id,
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
                  operatorId: userId,
                },
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
                  operatorId: userId,
                },
              });
              console.log("Transaction created:", transaction);

              newCustomer.currentDue = dueAmount;
              newCustomer.status = status === "overdue" ? "Overdue" : "Due";

              // ----------- CREATE REMINDERS -----------
              const offsets =
                paymentTermData?.reminderOffsets ??
                defaultPT?.reminderOffsets ??
                [];

              const userDoc = await User.findById(userId);
              const companyName = userDoc?.companyName;

              const effectiveOffsets = [...offsets];
              if (
                status === "overdue" &&
                !effectiveOffsets.some((o) => o < 0)
              ) {
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
                        userId,
                      );
                    } else if (reminderType === "due_today") {
                      templatePayload = await getDueTodayTemplate(
                        newCustomer.name,
                        dueAmount,
                        dueDate,
                        companyName,
                        userId,
                      );
                    } else {
                      templatePayload = await getOverdueTemplate(
                        newCustomer.name,
                        dueAmount,
                        dueDate,
                        companyName,
                        userId,
                      );
                    }

                    const remindercreated = await Reminder.create({
                      customerId: newCustomer._id,
                      transactionId: transaction._id,
                      reminderType,
                      scheduledFor: scheduledDate,
                      whatsappTemplate: {
                        name: templatePayload?.templateName,
                        language: templatePayload?.language,
                      },
                      templateVariables: [
                        newCustomer.name,
                        dueAmount.toString(),
                        dueDate.toDateString(),
                      ],
                      source: "auto",
                    });
                    console.log("Reminder created:", remindercreated);
                  } catch (er) {
                    console.log("Error creating reminder", er);
                  }
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
            updated: updatedCount,
          },
        },
        "Bulk upload completed successfully",
      ).send(res);
    }

    // -------- SINGLE CUSTOMER --------
    // -------- SINGLE CUSTOMER --------
    const mobile = customerData.mobile?.toString().replace(/\D/g, "");
    const formattedMobile =
      mobile.length === 12 && mobile.startsWith("91") ? mobile : `91${mobile}`;

    const dueAmount = Number(customerData.amount) || 0;
    const status = (customerData?.status || "").toLowerCase().trim();

    const paymentTermData = customerData.paymentTerm
      ? await PaymentTerm.findById(customerData.paymentTerm)
      : null;

    const creditDays =
      paymentTermData?.creditDays ?? defaultPT?.creditDays ?? 10;

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + creditDays);

    const newCustomer = await Customer.create({
      ...customerData,
      mobile: formattedMobile,
      CustomerOfComapny: userId,
      currentDue: 0,
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
            operatorId: userId,
          },
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
            operatorId: userId,
          },
        });

        newCustomer.currentDue = dueAmount;
        newCustomer.status = status === "overdue" ? "Overdue" : "Due";

        // ================= CREATE REMINDERS =================
        const offsets =
          paymentTermData?.reminderOffsets ?? defaultPT?.reminderOffsets ?? [];

        const userDoc = await User.findById(userId);
        const companyName = userDoc?.companyName;

        const effectiveOffsets = [...offsets];
        if (status === "overdue" && !effectiveOffsets.some((o) => o < 0)) {
          effectiveOffsets.push(-1);
        }

        for (const offset of effectiveOffsets) {
          const scheduledDate = new Date(dueDate);
          scheduledDate.setDate(scheduledDate.getDate() - offset);

          let reminderType = "before_due";
          if (offset === 0) reminderType = "due_today";
          if (offset < 0) reminderType = "after_due";

          // If overdue → only after_due reminders
          if (status === "overdue" && reminderType !== "after_due") continue;

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
                  userId,
                );
              } else if (reminderType === "due_today") {
                templatePayload = await getDueTodayTemplate(
                  newCustomer.name,
                  dueAmount,
                  dueDate,
                  companyName,
                  userId,
                );
              } else {
                templatePayload = await getOverdueTemplate(
                  newCustomer.name,
                  dueAmount,
                  dueDate,
                  companyName,
                  userId,
                );
              }

              const remindercreated = await Reminder.create({
                customerId: newCustomer._id,
                transactionId: transaction._id,
                reminderType,
                scheduledFor: scheduledDate,
                whatsappTemplate: {
                  name: templatePayload?.templateName,
                  language: templatePayload?.language,
                },
                templateVariables: [
                  newCustomer.name,
                  dueAmount.toString(),
                  dueDate.toDateString(),
                ],
                source: "auto",
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
      "Customer created successfully",
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
      .populate("transactions")
      .populate('reminders')
      .skip(offset)
      .limit(queryLimit);

    const total = await Customer.countDocuments(query);
    return new APIResponse(
      200,
      { customers, total, page, limit, totalPages: Math.ceil(total / limit) },
      "Fetched all customers",
    ).send(res);
  } catch (error) {
    return new APIError(500, error, "Failed to fetch the customers data").send(
      res,
    );
  }
};

//api/v1/customer/?CId_004
//doubt: for customer there is _id and CustomerId do i need here boolean check
export const getCustomersById = async (req, res) => {
  try {
    //only users's customer should be queried
    const { customerId } = req.params;
    const userId = req.user._id;

    const customer = await Customer.findOne({
      _id: customerId,
      CustomerOfComapny: userId,
    });
    if (!customer) {
      return new APIResponse(
        404,
        null,
        `No customer found for this Id ${customerId}`,
      ).send(res);
    }

    return new APIResponse(200, customer, "Customer found").send(res);
  } catch (error) {
    return new APIError(
      500,
      error,
      "Failed to get Customer by given CustomerId",
    ).send(res);
  }
};

export const updateCustomer = async (req, res) => {
  try {
    const { customerId } = req.params;
    const userId = req.user._id;
    const updatedData = req.body;

    if (!updatedData) {
      return new APIResponse(400, null, `No data provided to update`).send(res);
    }

    // Support Bulk Update if updatedData is an array
    if (Array.isArray(updatedData)) {
      const results = [];
      for (const data of updatedData) {
        if (!data._id) continue;
        const updated = await Customer.findOneAndUpdate(
          { _id: data._id, CustomerOfComapny: userId },
          data,
          { new: true }
        );
        if (updated) results.push(updated);
      }
      return new APIResponse(200, results, `${results.length} customers updated successfully`).send(res);
    }

    // Single Update
    const filters = {};
    filters.CustomerOfComapny = userId;
    filters._id = customerId;

    const response = await Customer.findOneAndUpdate(filters, updatedData, {
      new: true,
    });

    if (!response) {
      return new APIResponse(404, null, "Customer not found").send(res);
    }

    return new APIResponse(200, response, "Successfully updated").send(res);
  } catch (error) {
    return new APIError(500, error, "Failed to Update Customer").send(res);
  }
};


export const deleteCustomers = async (req, res) => {
  try {
    const userId = req.user._id;
    const bodyIds = req.body;

    console.log("ids to delete", bodyIds);

    const ids = Array.isArray(bodyIds) ? bodyIds : [bodyIds];

    if (!ids || ids.length === 0 || ids[0] == null) {
      return new APIError(400, ["No IDs provided for deletion"]).send(res);
    }

    if (ids.length > 1) {
      const result = await Customer.deleteMany({
        _id: { $in: ids },
        CustomerOfComapny: userId,
      });

      return new APIResponse(
        200,
        result,
        `${result.deletedCount} customers deleted`,
      ).send(res);
    } else {
      const customerId = ids[0];
      const customer = await Customer.findOne({
        _id: customerId,
        CustomerOfComapny: userId,
      });

      if (!customer) {
        return new APIError(404, ["Customer not found"]).send(res);
      }

      const result = await Customer.deleteOne({
        _id: customerId,
        CustomerOfComapny: userId,
      });

      return new APIResponse(
        200,
        result,
        `Customer with this Id: ${customerId} is deleted`,
      ).send(res);
    }
  } catch (error) {
    console.error("Delete customer error:", error);
    return new APIError(500, [error.message || "Failed to delete customer"]).send(res);
  }
};


// ─────────────────────────────────────────────────────────────────────────────
// VALIDATE BULK — pure in-memory dry-run, zero DB writes
// POST /api/v1/customers/validate-bulk
// ─────────────────────────────────────────────────────────────────────────────
export const validateBulkCustomers = async (req, res) => {
  try {
    const rows = req.body;
    if (!Array.isArray(rows) || rows.length === 0) {
      return new APIResponse(
        400,
        null,
        "Expected a non-empty array of customers",
      ).send(res);
    }

    const VALID_STATUSES = ["paid", "due", "overdue"];
    const EMAIL_RE = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const errors = [];

    rows.forEach((customer, index) => {
      const row = index + 1; // 1-based for UX

      // name
      const name = customer.name?.toString().trim() ?? "";
      if (!name) {
        errors.push({
          row,
          field: "name",
          value: customer.name ?? "",
          message: "Name is required",
        });
      } else if (name.length < 3) {
        errors.push({
          row,
          field: "name",
          value: name,
          message: "Name must be at least 3 characters",
        });
      } else if (name.length > 100) {
        errors.push({
          row,
          field: "name",
          value: name,
          message: "Name must be at most 100 characters",
        });
      }

      // mobile — strip non-digits, check for valid 10-digit Indian number
      // Only strip 91 country code prefix if the number is already 12 digits (full international format)
      const rawMobile = customer.mobile?.toString().replace(/\D/g, "") ?? "";
      const mobile =
        rawMobile.length === 12 && rawMobile.startsWith("91")
          ? rawMobile.slice(2) // already has country code: 919187657653 → 9187657653 ✓
          : rawMobile; // 10-digit number used as-is (including ones starting with 91)
      if (mobile.length !== 10) {
        errors.push({
          row,
          field: "mobile",
          value: customer.mobile ?? "",
          message:
            "Mobile must be a valid 10-digit number. Accepted formats: 9727131578 | 919727131578 | +91 9727131578 | +91 97271 31578",
        });
      }

      // email (optional)
      if (customer.email) {
        const email = customer.email.toString().trim();
        if (!EMAIL_RE.test(email) || email.length < 5 || email.length > 255) {
          errors.push({
            row,
            field: "email",
            value: email,
            message: "Invalid email address",
          });
        }
      }

      // status
      const status = customer.status?.toString().toLowerCase().trim() ?? "";
      if (status && !VALID_STATUSES.includes(status)) {
        errors.push({
          row,
          field: "status",
          value: customer.status ?? "",
          message: `Status must be one of: ${VALID_STATUSES.join(", ")}`,
        });
      }

      // amount (if present, must be a non-negative number)
      if (customer.amount !== undefined && customer.amount !== "") {
        const amount = Number(customer.amount);
        if (isNaN(amount) || amount < 0) {
          errors.push({
            row,
            field: "amount",
            value: customer.amount,
            message: "Amount must be a non-negative number",
          });
        }
      }
    });

    if (errors.length > 0) {
      return new APIResponse(
        200,
        { valid: false, errors },
        `Found ${errors.length} validation error(s)`,
      ).send(res);
    }

    return new APIResponse(
      200,
      { valid: true, errors: [] },
      "All rows are valid",
    ).send(res);
  } catch (error) {
    console.error("validateBulkCustomers error:", error);
    return new APIError(500, error.message, "Validation failed").send(res);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// BULK UPLOAD SSE — two-phase: in-memory prep → atomic bulk commit
// POST /api/v1/customers/bulk-upload-sse
// Uses Passport session cookie for auth (EventSource sends cookies automatically)
// ─────────────────────────────────────────────────────────────────────────────
export const bulkUploadSSE = async (req, res) => {
  // SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no"); // disable nginx buffering if behind proxy
  res.flushHeaders();

  const sendEvent = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  try {
    const customerData = req.body;
    if (!Array.isArray(customerData) || customerData.length === 0) {
      sendEvent({
        type: "error",
        message: "Expected a non-empty array of customers",
      });
      return res.end();
    }

    const userId = req.user._id;
    const total = customerData.length;

    // Get default payment term once
    const defaultPT = await PaymentTerm.findOne({
      owner: null,
      isDefault: true,
      isActive: true,
    }).sort({ createdAt: -1 });

    const userDoc = await User.findById(userId);
    const companyName = userDoc?.companyName;

    // ───────────── PHASE 1: Build all documents in memory ─────────────
    const customerBulkOps = []; // for Customer.bulkWrite
    const transactionDocs = []; // for Transaction.insertMany
    const reminderDocs = []; // for Reminder.insertMany
    const customerMobileMap = {}; // mobile → index in customerBulkOps (to link transaction customerIds)

    // We need to check for existing customers to decide upsert vs insert
    // Do a single batch lookup to avoid N round-trips
    const normalizedMobiles = customerData.map((c) => {
      const raw = c.mobile?.toString().replace(/\D/g, "") ?? "";
      // Only add 91 country code if not already a 12-digit international number
      return raw.length === 12 && raw.startsWith("91") ? raw : `91${raw}`;
    });

    const existingCustomers = await Customer.find({
      mobile: { $in: normalizedMobiles },
      CustomerOfComapny: userId,
    });
    const existingMap = {};
    existingCustomers.forEach((c) => {
      existingMap[c.mobile] = c;
    });

    let createdCount = 0;
    let updatedCount = 0;
    // We need actual ObjectIds for transactions — generate them now so we can link
    const { Types: MongooseTypes } = await import("mongoose");

    for (let i = 0; i < customerData.length; i++) {
      const customer = customerData[i];

      // progress event (phase 1)
      sendEvent({
        type: "progress",
        phase: 1,
        processed: i + 1,
        total,
        name: customer.name,
      });

      const formattedMobile = normalizedMobiles[i];
      const dueAmount = Number(customer.amount) || 0;
      const status = (customer.status ?? "due").toString().toLowerCase().trim();

      const paymentTermData = customer.paymentTerm
        ? await PaymentTerm.findById(customer.paymentTerm)
        : defaultPT;

      const creditDays =
        paymentTermData?.creditDays ?? defaultPT?.creditDays ?? 10;
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + creditDays);

      const existing = existingMap[formattedMobile];

      // Generate an ID for the new/existing customer we'll use for transaction linking
      const customerId = existing ? existing._id : new MongooseTypes.ObjectId();

      if (existing) {
        updatedCount++;
        // update op — $set and $inc must be sibling operators
        const updateOp = {
          $set: {
            status:
              status === "paid"
                ? "Paid"
                : status === "overdue"
                  ? "Overdue"
                  : "Due",
            paymentTerm: paymentTermData?._id ?? existing.paymentTerm,
          },
        };
        if (dueAmount > 0 && status !== "paid") {
          updateOp.$inc = { currentDue: dueAmount };
        }
        customerBulkOps.push({
          updateOne: { filter: { _id: existing._id }, update: updateOp },
        });
      } else {
        createdCount++;
        customerMobileMap[formattedMobile] = customerId;
        // insert op
        customerBulkOps.push({
          insertOne: {
            document: {
              _id: customerId,
              name: customer.name,
              mobile: formattedMobile,
              email: customer.email || undefined,
              gender: customer.gender || "other",
              CustomerOfComapny: userId,
              currentDue: dueAmount > 0 && status !== "paid" ? dueAmount : 0,
              status:
                status === "paid"
                  ? "Paid"
                  : status === "overdue"
                    ? "Overdue"
                    : "Due",
              paymentTerm: paymentTermData?._id ?? null,
            },
          },
        });
      }

      // Build transaction doc
      if (dueAmount > 0) {
        const txId = new MongooseTypes.ObjectId();
        const txDoc = {
          _id: txId,
          customerId,
          amount: dueAmount,
          paidAmount: status === "paid" ? dueAmount : 0,
          type: status === "paid" ? "PAYMENT" : "DUE_ADDED",
          paymentStatus:
            status === "paid"
              ? "PAID"
              : status === "overdue"
                ? "OVERDUE"
                : "PENDING",
          dueDate: status !== "paid" ? dueDate : undefined,
          metadata: {
            note:
              customer.note ||
              (status === "paid" ? "Bulk upload payment" : "Bulk upload due"),
            operatorId: userId,
          },
        };
        transactionDocs.push(txDoc);

        // Also queue a lastTransaction update for this customer
        customerBulkOps.push({
          updateOne: {
            filter: existing ? { _id: existing._id } : { _id: customerId },
            update: { $set: { lastTransaction: txId } },
          },
        });

        // Build reminder docs (only for due/overdue)
        if (status !== "paid") {
          const offsets =
            paymentTermData?.reminderOffsets ??
            defaultPT?.reminderOffsets ??
            [];
          const effectiveOffsets = [...offsets];
          if (status === "overdue" && !effectiveOffsets.some((o) => o < 0)) {
            effectiveOffsets.push(-1);
          }

          for (const offset of effectiveOffsets) {
            let reminderType =
              offset > 0
                ? "before_due"
                : offset === 0
                  ? "due_today"
                  : "after_due";
            if (status === "overdue" && reminderType !== "after_due") continue;

            const scheduledDate = new Date(dueDate);
            scheduledDate.setDate(scheduledDate.getDate() - offset);
            if (scheduledDate < new Date()) {
              scheduledDate.setTime(Date.now() + 1000 * 60 * 5);
            }

            let templatePayload;
            try {
              if (reminderType === "before_due") {
                templatePayload = await getBeforeDueTemplate(
                  customer.name,
                  dueAmount,
                  dueDate,
                  companyName,
                  userId,
                );
              } else if (reminderType === "due_today") {
                templatePayload = await getDueTodayTemplate(
                  customer.name,
                  dueAmount,
                  dueDate,
                  companyName,
                  userId,
                );
              } else {
                templatePayload = await getOverdueTemplate(
                  customer.name,
                  dueAmount,
                  dueDate,
                  companyName,
                  userId,
                );
              }
            } catch (_) {
              /* skip reminder if template fails */
            }

            reminderDocs.push({
              customerId,
              transactionId: txId,
              reminderType,
              scheduledFor: scheduledDate,
              whatsappTemplate: templatePayload
                ? {
                  name: templatePayload.templateName,
                  language: templatePayload.language,
                }
                : undefined,
              templateVariables: [
                customer.name,
                dueAmount.toString(),
                dueDate.toDateString(),
              ],
              source: "auto",
            });
          }
        }
      }
    }

    // ───────────── PHASE 2: Atomic bulk commit ─────────────
    sendEvent({ type: "saving", message: "Saving to database..." });

    if (customerBulkOps.length > 0)
      await Customer.bulkWrite(customerBulkOps, { ordered: false });
    if (transactionDocs.length > 0)
      await Transaction.insertMany(transactionDocs, { ordered: false });
    if (reminderDocs.length > 0)
      await Reminder.insertMany(reminderDocs, { ordered: false });

    sendEvent({
      type: "done",
      created: createdCount,
      updated: updatedCount,
      total,
    });
    res.end();
  } catch (error) {
    console.error("bulkUploadSSE error:", error);
    sendEvent({
      type: "error",
      message: error.message || "Bulk upload failed",
    });
    res.end();
  }
};
