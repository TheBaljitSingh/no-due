import User from "../model/user.model.js";
import { APIError } from "../utils/ResponseAndError/ApiError.utils.js";
import { APIResponse } from "../utils/ResponseAndError/ApiResponse.utils.js";

export const registerUser = async (req, res) => {
    const userData = req.body;
    try {
        const savedUser = await User.create(userData);
        return new APIResponse(201, { user: savedUser }, 'User registered successfully').send(res);
    } catch (err) {
        console.error('Error registering user:', err);
        return new APIError(500, ['User registration failed', err.message]).send(res);
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

export const updatePassword = async (req, res) => {
    try {
        const userId = req.user._id;
        const { currentPassword, newPassword } = req.body;

        // Validate input
        if (!currentPassword || !newPassword) {
            return new APIError(400, ['Current password and new password are required']).send(res);
        }

        // Get user with password field
        const user = await User.findById(userId).select('+password');

        if (!user) {
            return new APIError(404, ['User not found']).send(res);
        }

        // Check if user has a password (might be Google OAuth user)
        if (!user.password) {
            return new APIError(400, ['Cannot update password for OAuth users']).send(res);
        }

        // Verify current password
        const isPasswordCorrect = await user.comparePassword(currentPassword);
        if (!isPasswordCorrect) {
            return new APIError(401, ['Current password is incorrect']).send(res);
        }

        // Update password
        user.password = newPassword;
        await user.save();

        return new APIResponse(200, {}, 'Password updated successfully').send(res);
    } catch (error) {
        console.error("Password update error:", error);
        return new APIError(500, [error.message]).send(res);
    }
};
