import User from "../model/user.model.js";
import { APIError } from "../utils/ResponseAndError/ApiError.utils.js";
import { APIResponse } from "../utils/ResponseAndError/ApiResponse.utils.js";

export const registerUser = async (req, res) => {
    const userData  = req.body;
    try{
        const savedUser = await User.create(userData);
        return new APIResponse(201,{user: savedUser},'User registered successfully').send(res);
    }catch(err){
        console.error('Error registering user:', err);
        return new APIError(500,['User registration failed', err.message]).send(res);
    }
    
};

export const updateUser = async (req, res) => {
    try {
        const userId = req.user._id;
        const updates = req.body;

        const existingProfile = await User.findById(userId);

        if (!existingProfile) {
            return new APIError(404, ['Profile not found']).send(res);
        }

        // Prevent emptying fields once filled
        const protectedFields = [
            "companyName",
            "GSTNumber",
            "fullName",
            "phoneNumber",
            "email"
        ];

        protectedFields.forEach(field => {
            if (
                existingProfile[field] &&       // already has value in db
                (!updates[field] || updates[field].trim() === "")  // trying to empty it
            ) {
                updates[field] = existingProfile[field]; // keep old value
            }
        });

        const updatedProfile = await User.findOneAndUpdate(
            { _id: userId },
            updates,
            { new: true }
        );

        return new APIResponse(200, { profile: updatedProfile }, 'Profile updated successfully').send(res);
    } catch (error) {
        console.error("Profile update error:", error);
        return new APIError(500, [error.message]).send(res);
    }
};

