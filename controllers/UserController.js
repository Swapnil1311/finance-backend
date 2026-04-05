const User = require("../models/UserModel");
const Role = require("../models/RoleModel");
const {
  successResponse,
  errorResponse,
  paginatedResponse,
  buildPagination,
  parsePagination,
} = require("../utils/responseHelper");

const getAllUsers = async (req, res, next) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const { search, isActive } = req.query;

    // Build filter
    const filter = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }
    if (isActive !== undefined) {
      filter.isActive = isActive === "true";
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .populate("role")
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      User.countDocuments(filter),
    ]);

    return paginatedResponse(
      res,
      "Users fetched successfully.",
      users,
      buildPagination(total, page, limit)
    );
  } catch (error) {
    next(error);
  }
};

const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).populate("role");
    if (!user) return errorResponse(res, "User not found.", 404);
    return successResponse(res, "User fetched successfully.", user);
  } catch (error) {
    next(error);
  }
};

const updateUserRole = async (req, res, next) => {
  try {
    const { role: roleId } = req.body;

    // Prevent admin from demoting themselves
    if (req.params.id === req.user._id.toString()) {
      return errorResponse(res, "Admins cannot change their own role.", 403);
    }

    const role = await Role.findById(roleId);
    if (!role) return errorResponse(res, "Role not found.", 404);

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role: roleId },
      { new: true, runValidators: true }
    ).populate("role");

    if (!user) return errorResponse(res, "User not found.", 404);

    return successResponse(
      res,
      `User role updated to '${role.name}' successfully.`,
      user
    );
  } catch (error) {
    next(error);
  }
};

const toggleUserStatus = async (req, res, next) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return errorResponse(res, "You cannot deactivate yourself.", 403);
    }

    const user = await User.findById(req.params.id);
    if (!user) return errorResponse(res, "User not found.", 404);

    user.isActive = !user.isActive;
    await user.save({ validateBeforeSave: false });

    return successResponse(
      res,
      `User ${user.isActive ? "activated" : "deactivated"} successfully.`,
      { _id: user._id, name: user.name, isActive: user.isActive }
    );
  } catch (error) {
    next(error);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return errorResponse(res, "You cannot delete yourself.", 403);
    }

    const user = await User.findById(req.params.id);
    if (!user) return errorResponse(res, "User not found.", 404);

    await user.softDelete();

    return successResponse(res, "User deleted (soft) successfully.", {
      _id: user._id,
      name: user.name,
      deletedAt: user.deletedAt,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  updateUserRole,
  toggleUserStatus,
  deleteUser,
};
