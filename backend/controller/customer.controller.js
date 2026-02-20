import Customer from "../model/customer.model.js";
import { APIError } from "../utils/ResponseAndError/ApiError.utils.js";
import { APIResponse } from "../utils/ResponseAndError/ApiResponse.utils.js";
import Transaction from "../model/transaction.model.js"

export const createCustomer = async (req, res) => {
  try {
    const customerData = req.body;


    if (!customerData) {
      return new APIResponse(400, null, "Data is required").send(res);
    }

    if (Array.isArray(customerData)) {
      const userId = req.user._id;
      let createdCount = 0;
      let updatedCount = 0;
      const results = [];

      for (const customer of customerData) {
        // Ensure mobile number has country code
        const mobile = customer.mobile?.toString().replace(/\D/g, ''); // sanitize
        const formattedMobile = mobile.startsWith('91') ? mobile : `91${mobile}`;


        // Check if customer already exists by mobile number
        const existingCustomer = await Customer.findOne({
          mobile: formattedMobile,
          CustomerOfComapny: userId
        }).populate('paymentTerm');

        // console.log(existingCustomer);

        if (existingCustomer) {
          // Customer exists - accumulate due
          const dueAmount = Number(customer.due) || 0;

          if (dueAmount > 0) {
            // Calculate due date based on payment term
            const creditDays = existingCustomer.paymentTerm?.creditDays ?? 0;
            const dueDate = new Date();
            dueDate.setDate(dueDate.getDate() + creditDays);

            // Create transaction for the new due
            const transaction = await Transaction.create({
              customerId: existingCustomer._id,
              type: "DUE_ADDED",
              amount: dueAmount,
              paidAmount: 0,
              paymentStatus: "PENDING",
              dueDate,
              metadata: {
                note: customer.note || "Bulk upload due addition",
                operatorId: userId
              }
            });

            console.log("transactikon created", transaction);

            // Update customer's current due and last transaction
            existingCustomer.currentDue += dueAmount;
            existingCustomer.lastTransaction = transaction._id;
            existingCustomer.status = existingCustomer.status === "Overdue" ? "Overdue" : "Due";



            //one doubt should i add reminder also???

            // Update feedback if provided in upload (optional, but good for sync)
            if (customer.feedback) existingCustomer.feedback = customer.feedback;

            // Update other fields if provided (optional - decide if overwrite or keep)
            // For now, let's keep existing details to avoid accidental overwrites of corrected data
            if (customer.name) existingCustomer.name = customer.name;
            if (customer.email) existingCustomer.email = customer.email;
            if (customer.company) existingCustomer.company = customer.company;

            await existingCustomer.save();
          }

          updatedCount++;
          results.push(existingCustomer);
        } else {
          // New customer - create record

          const dueAmount = Number(customer.due) || 0;
          const paymentTerm = customer.paymentTerm;


          const newCustomerData = {
            ...customer,
            mobile: formattedMobile,
            CustomerOfComapny: userId
          };
          const newCustomer = await Customer.create(newCustomerData);

          if(dueAmount>0){
            //have to create transaction here
            const creditDays = paymentTerm?.creditDays ?? 0;
            const dueDate = new Date();
            dueDate.setDate(dueDate.getDate() + creditDays);

            const transaction = await Transaction.create({
              customerId: newCustomer._id,
              type: "DUE_ADDED",
              amount: dueAmount,
              paidAmount: 0,
              paymentStatus: "PENDING",
              dueDate,
              metadata: {
                note: customer.note || "Bulk upload due addition",
                operatorId: userId
              }
            });
            newCustomer.lastTransaction = transaction._id;
            newCustomer.currentDue = dueAmount;
            newCustomer.status = customer.status=='Due'?'Due':'';
            await newCustomer.save();
          }
          console.log("newCustomer", newCustomer);

          createdCount++;
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
        `Bulk upload complete: ${createdCount} created, ${updatedCount} updated`
      ).send(res);
    }

    // Handle single customer creation
    customerData.CustomerOfComapny = req.user._id;
    customerData.mobile = `91${customerData.mobile}`;

    const newCustomer = new Customer(customerData);
    await newCustomer.save();

    return new APIResponse(201, newCustomer, "Customer created successfully").send(res);


  } catch (error) {
    console.log(error);

    if (error.name === "ValidationError") {
      const errors = {};

      Object.keys(error.errors).forEach((field) => {
        errors[field] = error.errors[field].message;
      });

      return new APIError(400, errors, "Validation Failed").send(res);
    }

    return new APIError(500, error?.message, "Failed to create customer").send(res);
  }
};


export const getCustomers = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    const queryLimit = limit === "all" ? 0 : parseInt(limit);

    const userId = req.user._id;


    const query = { CustomerOfComapny: userId };

    const customers = await Customer.find(query)
      .populate("lastTransaction", "commitmentStatus")
      .populate("paymentTerm", "name")
      .skip(offset)
      .limit(queryLimit);


    const total = await Customer.countDocuments(query);
    return new APIResponse(200, { customers, total, page, limit, totalPages: Math.ceil(total / limit) }, "Fetched all customers",).send(res); // have to check response 

  } catch (error) {
    return new APIError(500, error, "Failed to fetch the customers data").send(res); // have to check res

  }
}

//api/v1/customer/?CId_004
//doubt: for customer there is _id and CustomerId do i need here boolean check
export const getCustomersById = async (req, res) => {
  try {
    //only users's customer should be queried
    const { customerId } = req.params;

    const customer = await Customer.findById(customerId);
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

    const customer = await Customer.find({ customerId });

    if (!customer) {
      return new APIResponse(404, null, "Customer not found").send(res);
    }

    const result = await Customer.findByIdAndDelete(customerId);

    return new APIResponse(200, result, `Customer with this Id: ${customerId} is deleted`,).send(res);


  } catch (error) {
    console.log(error);
    return new APIError(500, error, "Failed to delete customer").send(res);

  }
}