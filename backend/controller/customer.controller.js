import Customer from "../model/customer.model.js";
import { APIError } from "../utils/ResponseAndError/ApiError.utils.js";
import { APIResponse } from "../utils/ResponseAndError/ApiResponse.utils.js";

export const createCustomer = async (req, res) => {
  try {
    const customerData = req.body;

    if (!customerData) {
      return new APIResponse(400, null, "Data is required").send(res);
    }

    if (Array.isArray(customerData)) {

      const formattedData = customerData.map(c => ({
        ...c,
        CustomerOfComapny: req.user._id
      }));

      // console.log("Formatted Data:", formattedData);

      const inserted = await Customer.insertMany(formattedData ); // if any error it roll back, use boolean if required

      return new APIResponse(
        201,
        inserted,
        `${inserted.length} customers inserted`
      ).send(res);
    }

    customerData.CustomerOfComapny =  req.user._id;

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


export const getCustomers = async(req, res)=>{
    try {
        const {page = 1 , limit = 10} = req.query;
        const offset = (page - 1)*limit;
        const queryLimit = limit==="all"?0:parseInt(limit);

        const userId = req.user._id;


        const query = {CustomerOfComapny:userId}; 
    
        const customers = await Customer.find(query).skip(offset).limit(queryLimit); 

        
        const total = await Customer.countDocuments(query);
        return new APIResponse(200, {customers, total, page, limit, totalPages: Math.ceil(total/limit)}, "Fetched all customers", ).send(res); // have to check response 
        
    } catch (error) {
        return new APIError(500, error, "Failed to fetch the customers data").send(res); // have to check res
        
    }
}

//api/v1/customer/?CId_004
//doubt: for customer there is _id and CustomerId do i need here boolean check
export const getCustomersById = async(req, res)=>{
    try {
        //only users's customer should be queried
        const {customerId } = req.params;

        const customer = await Customer.findById(customerId);
        if(!customer){
            return new APIResponse(404, null, `No customer found for this Id ${customerId}`).send(res); 
        }
        
        return new APIResponse(200, customer, "Customer found",).send(res); 

        
    } catch (error) {
        
        return new APIError(500, error, "Failed to get Customer by given CustomerId",).send(res);
    }
}

export const updateCustomer = async(req, res)=>{
    try {
        const {customerId} = req.params;
        const userId = req.user._id;
        const updatedData = req.body;
        if(!updatedData){
          return new APIResponse(400, null, `No data provided to update`).send(res);
        }
        const filters = {};
        filters.CustomerOfComapny = userId;
        filters._id = customerId; 
        
        const response = await Customer.findOneAndUpdate(filters, updatedData, {new: true});
        return new APIResponse(200, response, "Successfully updated").send(res);

    } catch (error) {
        return new APIError(500, error, "Failed to Update Customer",).send(res);

    }
}

export const deleteCustomers = async(req, res)=>{
    try {
        const {customerId} = req.params;

        const customer = await Customer.find({customerId});

        if(!customer){
            return new APIResponse(404, null, "Customer not found").send(res);
        }

        const result = await Customer.findByIdAndDelete(customerId);

        return new APIResponse(200, result, `Customer with this Id: ${customerId} is deleted`,).send(res); 


    } catch (error) {
      console.log(error);
        return new APIError(500, error, "Failed to delete customer").send(res);
        
    }
}