const User = require("../models/UserModel");
const Role = require("../models/RoleModel");
const { successResponse, errorResponse } = require("../utils/responseHelper");

const register = async (req, res, next) => {
  try {
    const { name, email, password, roleName = "viewer" } = req.body;

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return errorResponse(res, "Email is already registered.", 409);
    }

    // Fetch the role document (default: viewer)
    const role = await Role.findOne({ name: roleName.toLowerCase() });
    if (!role) {
      return errorResponse(
        res,
        `Role '${roleName}' not found. Please seed roles first (POST /api/roles/seed).`,
        404
      );
    }

    const user = await User.create({ name, email, password, role: role._id });

    const token = user.generateToken();

    await user.populate("role");

    return successResponse(
      res,
      "Registration successful. Welcome!",
      {
        token,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt,
        },
      },
      201
    );
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email })
      .select("+password")
      .populate("role");

    if (!user) {
      return errorResponse(res, "Invalid email or password.", 401);
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return errorResponse(res, "Invalid email or password.", 401);
    }

    if (!user.isActive) {
      return errorResponse(res, "Account deactivated. Contact admin.", 403);
    }

    // Update last login timestamp
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    // Generate token
    const token = user.generateToken();

    return successResponse(res, "Login successful.", {
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        lastLogin: user.lastLogin,
      },
    });
  } catch (error) {
    next(error);
  }
};
getMe = async (req, res, next) => {
  try {
    const user = req.user;

    return successResponse(res, "Profile fetched successfully.", {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
    });
  } catch (error) {
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select("+password");

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return errorResponse(res, "Current password is incorrect.", 400);
    }

    user.password = newPassword;
    await user.save();

    return successResponse(res, "Password changed successfully.");
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, getMe, changePassword };
