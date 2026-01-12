import Customer from "../model/customer.model.js";
export const getCurrentDue= async({from})=>{
  console.log(from);
    try {
    // const { Customer } = await import("../model/customer.model.js");

    const customer = await Customer.findOne({ mobile:from });

    if (!customer) {
      return { text: "Customer not found.", success:false };
    }

    return {
      text: `Your current due is ₹${customer.currentDue}`,
      success: true
    };
  } catch (error) {
    console.error("getCurrentDue error:", error);
    return { text: "Something went wrong.", success:false };
  }
}