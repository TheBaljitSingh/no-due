import Transaction from "../model/transaction.model.js";
import User from "../model/user.model.js";
import { APIError } from "../utils/ResponseAndError/ApiError.utils.js";
import { APIResponse } from "../utils/ResponseAndError/ApiResponse.utils.js";

const generateAvatar = async (fname, lname) => {
  try {
    // Make a request to DiceBear API
    const response = await axios.get(`https://api.dicebear.com/5.x/initials/svg?seed=${fname} ${lname}`);
    
    // Get the SVG content from the response
    const avatarSvg = response.data;
    
    return avatarSvg;
  } catch (error) {
    console.error("Error generating avatar:", error);
    return "https://api.dicebear.com/9.x/pixel-art/svg"; // Fallback if something goes wrong
  }
};
export const registerUser = async (req, res) => {
  const userData = req.body;
  try {
    const avatar = await generateAvatar(userData?.fname, userData?.lname); // Generate an avatar
    const savedUser = await User.create(userData);
    savedUser.profileImageUrl = avatar;
    await savedUser.save();
    
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


export const getAllTransaction = async (req, res) => {
  try {
    const userId = req.user._id; // logged-in company owner
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const baseAggregation = [
      // Lookup Customer
      {
        $lookup: {
          from: "customers",
          localField: "customerId",
          foreignField: "_id",
          as: "customer"
        }
      },
      { $unwind: "$customer" },
      // Match only this company’s customers and pending dues
      {
        $match: {
          "customer.CustomerOfComapny": userId,
          type: "DUE_ADDED",
         // paymentStatus: { $ne: "PAID" } //for now adding the paid transaction also
        }
      },
      // Calculate remaining balance (virtual field isn't available in aggregation)
      {
        $addFields: {
          remainingDue: {
            $subtract: [
              "$amount",
              { $ifNull: ["$paidAmount", 0] }
            ]
          },
          overdueByDay: {
            $cond: {
              if: { $and: [{ $gt: [new Date(), "$dueDate"] }, { $ne: ["$dueDate", null] }] },
              then: {
                $ceil: {
                  $divide: [
                    { $subtract: [new Date(), "$dueDate"] },
                    1000 * 60 * 60 * 24
                  ]
                }
              },
              else: 0
            }
          }
        }
      },
      // Only show dues that haven't been fully paid, but for now sending that dues also
      // {
      //   $match: {
      //     remainingDue: { $gt: 0 }
      //   }
      // },
      // Group by customer to calculate accumulated total due
      {
        $group: {
          _id: "$customer._id",
          customerName: { $first: "$customer.name" },
          customerPhone: { $first: "$customer.mobile" },
          totalDue: { $sum: "$remainingDue" },

          transactions: {
            $push: {
              _id: "$_id",
              amount: "$amount",
              paidAmount: { $ifNull: ["$paidAmount", 0] },
              remainingDue: "$remainingDue",
              type: "$type",
              paymentStatus: "$paymentStatus",
              dueDate: "$dueDate",
              createdAt: "$createdAt",
              note: "$metadata.note",
              overdueByDay: { $ifNull: ["$overdueByDay", 0] }
            }
          }
        }
      },
      // Sort by the latest transaction in the group
      {
        $addFields: {
          latestTxAt: { $max: "$transactions.createdAt" }
        }
      },
      { $sort: { latestTxAt: -1 } }
    ];

    // Get total count of unique customers (groups)
    const countResult = await Transaction.aggregate([
      ...baseAggregation,
      { $count: "total" }
    ]);
    const totalGroups = countResult.length > 0 ? countResult[0].total : 0;

    // Get paginated data
    const transactions = await Transaction.aggregate([
      ...baseAggregation,
      { $skip: skip },
      { $limit: limit }
    ]);

    return new APIResponse(
      200,
      {
        transactions,
        pagination: {
          totalGroups,
          currentPage: page,
          totalPages: Math.ceil(totalGroups / limit),
          limit
        }
      },
      "Transactions fetched successfully"
    ).send(res);

  } catch (error) {
    console.error("Transaction fetch error:", error);
    return new APIError(500, [error.message]).send(res);
  }
};
