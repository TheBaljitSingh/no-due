import PaymentTerm from "../model/PaymentTerm.model.js";
import { APIError } from "../utils/ResponseAndError/ApiError.utils.js";
import { APIResponse } from "../utils/ResponseAndError/ApiResponse.utils.js";

export const getUserPaymentTerms = async (req, res) => {
    try {
        const userId = req.user?._id;
        const paymentTerms = await PaymentTerm.find({
            $or: [
                { owner: userId },
                { owner: null }
            ]
        });
        return new APIResponse(200, { paymentTerms }).send(res);
    } catch (error) {
        console.error("Error in getAllPaymentTerms:", error);
        return new APIError(500, "Internal Server Error").send(res);
    }
};

export const createPaymentTerm = async (req, res) => {
    try {
        const userId = req.user?._id;
        const { name, creditDays, reminderOffsets,isDefault, isActive } = req.body;
        const newPaymentTerm = await PaymentTerm.create({
            name,
            creditDays,
            reminderOffsets,
            isDefault,
            isActive,
            owner: userId
        });
        return new APIResponse(201, { paymentTerm: newPaymentTerm }).send(res);
    } catch (error) {
        console.error("Error in createPaymentTerm:", error);
        return new APIError(500, "Internal Server Error").send(res);
    }
};

export const deletePaymentTerm = async (req, res) => {
    try {
        const userId = req.user?._id;
        const { id } = req.params;
        const paymentTerm = await PaymentTerm.findOneAndDelete({ _id: id, owner: userId });
        if (!paymentTerm) {
            return new APIError(404, "Payment Term not found").send(res);
        };
        return new APIResponse(200, { message: "Payment Term deleted successfully" }).send(res);
    } catch (error) {
        console.error("Error in deletePaymentTerm:", error);
        return new APIError(500, "Internal Server Error").send(res);
    }
};

export const updatePaymentTerm = async (req, res) => {
    try {
        const userId = req.user?._id;
        const { id } = req.params;
        const { name, creditDays, reminderOffsets,isDefault, isActive } = req.body;
        const paymentTerm = await PaymentTerm.findOne({ _id: id, owner: userId });
        if (!paymentTerm) {
            return new APIError(404, "Payment Term not found").send(res);
        }
        paymentTerm.name = name || paymentTerm.name;
        paymentTerm.creditDays = creditDays !== undefined ? creditDays : paymentTerm.creditDays;
        paymentTerm.reminderOffsets = reminderOffsets || paymentTerm.reminderOffsets;
        paymentTerm.isDefault = isDefault !== undefined ? isDefault : paymentTerm.isDefault;
        paymentTerm.isActive = isActive !== undefined ? isActive : paymentTerm.isActive;
        await paymentTerm.save();
        return new APIResponse(200, { paymentTerm }).send(res);
    }
    catch (error) {
        console.error("Error in updatePaymentTerm:", error);
        return new APIError(500, "Internal Server Error").send(res);
    }   
};
