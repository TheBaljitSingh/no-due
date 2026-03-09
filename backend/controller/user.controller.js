import Transaction from "../model/transaction.model.js";
import Notification from "../model/notification.model.js";
import User from "../model/user.model.js";
import { APIError } from "../utils/ResponseAndError/ApiError.utils.js";
import { APIResponse } from "../utils/ResponseAndError/ApiResponse.utils.js";
import axios from "axios";

const generateAvatar = (fname, lname) => {
  const name = encodeURIComponent(`${fname || ""} ${lname || ""}`.trim());
  return `https://ui-avatars.com/api/?name=${name}&background=00A63E&size=128&rounded=true&bold=true&color=fff`;

};

export const registerUser = async (req, res) => {
  const userData = req.body;
  try {
    const existingUser = await User.findOne({ email: userData.email });
    if (existingUser) {
      return new APIError(400, ["User already exists"]).send(res);
    }
    const avatar = generateAvatar(userData?.fname, userData?.lname); // Generate an avatar
    const savedUser = await User.create({
      ...userData,
      profileImageUrl: avatar
    });

    //have to create here default notification of type system_alert
    const notification = await Notification.create({
      userId: savedUser._id,
      type: "system_alert",
      title: "Welcome to No Due",
      message: "Thank you for registering with No Due. We are happy to have you with us.",
    });

    await savedUser.save();
    savedUser.password = undefined;
    savedUser.createdAt = undefined;
    savedUser.updatedAt = undefined;

    return new APIResponse(
      201,
      { user: savedUser },
      "User registered successfully",
    ).send(res);
  } catch (err) {
    console.error("Error registering user:", err);
    return new APIError(500, ["User registration failed", err.message]).send(
      res,
    );
  }
};

export const updateUser = async (req, res) => {
  try {
    const userId = req.user._id;
    const updates = req.body;

    const existingProfile = await User.findById(userId);

    if (!existingProfile) {
      return new APIError(404, ["Profile not found"]).send(res);
    }

    // Prevent emptying fields once filled
    const protectedFields = [
      "companyName",
      "GSTNumber",
      "fullName",
      "phoneNumber",
      "email",
    ];

    protectedFields.forEach((field) => {
      if (
        existingProfile[field] && // already has value in db
        (!updates[field] || updates[field].trim() === "") // trying to empty it
      ) {
        updates[field] = existingProfile[field]; // keep old value
      }
    });

    const updatedProfile = await User.findOneAndUpdate(
      { _id: userId },
      updates,
      { new: true },
    );

    return new APIResponse(
      200,
      { profile: updatedProfile },
      "Profile updated successfully",
    ).send(res);
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
      return new APIError(400, [
        "Current password and new password are required",
      ]).send(res);
    }

    // Get user with password field
    const user = await User.findById(userId).select("+password");

    if (!user) {
      return new APIError(404, ["User not found"]).send(res);
    }

    // Check if user has a password (might be Google OAuth user)
    if (!user.password) {
      return new APIError(400, ["Cannot update password for OAuth users"]).send(
        res,
      );
    }

    // Verify current password
    const isPasswordCorrect = await user.comparePassword(currentPassword);
    if (!isPasswordCorrect) {
      return new APIError(401, ["Current password is incorrect"]).send(res);
    }

    // Update password
    user.password = newPassword;
    await user.save();

    return new APIResponse(200, {}, "Password updated successfully").send(res);
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
    const query = req.query.query || "";

    // Advanced Filters
    const statuses = req.query.statuses ? req.query.statuses.split(",") : [];
    const overdue = req.query.overdue || "any";
    const minAmt = parseFloat(req.query.minAmt) || null;
    const maxAmt = parseFloat(req.query.maxAmt) || null;
    const fromDate = req.query.from || null;
    const toDate = req.query.to || null;

    const skip = (page - 1) * limit;

    const baseAggregation = [
      // Lookup Customer
      {
        $lookup: {
          from: "customers",
          localField: "customerId",
          foreignField: "_id",
          as: "customer",
        },
      },
      { $unwind: "$customer" },
      // Match only this company’s customers and pending dues
      {
        $match: {
          "customer.CustomerOfComapny": userId,
          type: "DUE_ADDED",
          ...(query ? {
            $or: [
              { "customer.name": { $regex: query, $options: "i" } },
              { "customer.mobile": { $regex: query, $options: "i" } },
              { "paymentStatus": { $regex: query, $options: "i" } },
              { $expr: { $regexMatch: { input: { $toString: "$amount" }, regex: query, options: "i" } } }
            ]
          } : {})
        },
      },
      // Calculate remaining balance (virtual field isn't available in aggregation)
      {
        $addFields: {
          remainingDue: {
            $subtract: ["$amount", { $ifNull: ["$paidAmount", 0] }],
          },
          overdueByDay: {
            $cond: {
              if: {
                $and: [
                  { $gt: [new Date(), "$dueDate"] },
                  { $ne: ["$dueDate", null] },
                ],
              },
              then: {
                $ceil: {
                  $divide: [
                    { $subtract: [new Date(), "$dueDate"] },
                    1000 * 60 * 60 * 24,
                  ],
                },
              },
              else: 0,
            },
          },
        },
      },
      // Only show dues that haven't been fully paid, but for now sending that dues also
      // {
      //   $match: {
      //     remainingDue: { $gt: 0 }
      //   }
      // },
      // Group by customer to calculate accumulated total due
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
              overdueByDay: { $ifNull: ["$overdueByDay", 0] },
            },
          },
        },
      },
      // Apply advanced filters on grouped data
      {
        $match: {
          ...(statuses.length > 0 ? { "transactions.paymentStatus": { $in: statuses } } : {}),
          ...(overdue !== "any" ? {
            "transactions": {
              $elemMatch: {
                overdueByDay: overdue === "none" ? 0 :
                  overdue === "1-7" ? { $gte: 1, $lte: 7 } :
                    overdue === "8-30" ? { $gte: 8, $lte: 30 } :
                      overdue === "30+" ? { $gt: 30 } : { $exists: true }
              }
            }
          } : {}),
          ...(fromDate || toDate ? {
            "transactions.dueDate": {
              ...(fromDate ? { $gte: new Date(fromDate) } : {}),
              ...(toDate ? { $lte: new Date(toDate) } : {})
            }
          } : {}),
          ...(minAmt !== null || maxAmt !== null ? {
            totalDue: {
              ...(minAmt !== null ? { $gte: minAmt } : {}),
              ...(maxAmt !== null ? { $lte: maxAmt } : {})
            }
          } : {})
        }
      },
      // Sort by the latest transaction in the group, with secondary stable sort on ID
      {
        $addFields: {
          latestTxAt: { $max: "$transactions.createdAt" },
        },
      },
      { $sort: { latestTxAt: -1, _id: 1 } },
    ];

    // Perform facet to get both paginated data and overall stats in a single call
    const aggregationResult = await Transaction.aggregate([
      ...baseAggregation,
      {
        $facet: {
          data: [
            { $skip: skip },
            { $limit: limit }
          ],
          totalStats: [
            {
              $group: {
                _id: null,
                totalOverallDue: { $sum: "$totalDue" },
                totalOverallTransactions: { $sum: { $size: "$transactions" } },
                totalOverdueCustomers: {
                  $sum: {
                    $cond: [
                      { $gt: [{ $max: "$transactions.overdueByDay" }, 0] },
                      1,
                      0
                    ]
                  }
                },
                totalGroups: { $sum: 1 }
              }
            }
          ]
        }
      }
    ]);

    const transactions = aggregationResult[0].data;
    const stats = aggregationResult[0].totalStats[0] || {
      totalOverallDue: 0,
      totalOverallTransactions: 0,
      totalOverdueCustomers: 0,
      totalGroups: 0,
    };

    return new APIResponse(
      200,
      {
        transactions,
        stats,
        pagination: {
          totalGroups: stats.totalGroups,
          currentPage: page,
          totalPages: Math.ceil(stats.totalGroups / limit),
          limit,
        },
      },
      "Transactions fetched successfully",
    ).send(res);

  } catch (error) {
    console.error("Transaction fetch error:", error);
    return new APIError(500, [error.message]).send(res);
  }
};
