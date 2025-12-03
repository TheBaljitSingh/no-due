// import Customer from "../model/customer.model.js";
// import { APIError } from "../utils/ResponseAndError/ApiError.utils.js";
// import { APIResponse } from "../utils/ResponseAndError/ApiResponse.utils.js";


// export const createCustomer = async (req, res) => {
//     try {
//         const customerData = req.body;
//         const newCustomer = new Customer(customerData);
//         await newCustomer.save();
//         return new APIResponse(201, newCustomer, "Customer created successfully").send(res);
//     } catch (error) {
//       return new APIError   (500, "Failed to create customer", error).send(res);
// }
// };