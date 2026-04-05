const Role = require("../models/RoleModel");
const { successResponse, errorResponse } = require("../utils/responseHelper");

const seedRoles = async (req, res, next) => {
  try {
    const defaultRoles = [
      {
        name: "viewer",
        permissions: Role.DEFAULT_PERMISSIONS.viewer,
        description: "Can only view financial records and dashboard.",
      },
      {
        name: "analyst",
        permissions: Role.DEFAULT_PERMISSIONS.analyst,
        description: "Can view and create/update financial records.",
      },
      {
        name: "admin",
        permissions: Role.DEFAULT_PERMISSIONS.admin,
        description: "Full access: view, write, delete records, manage users.",
      },
    ];

    const results = [];
    for (const roleData of defaultRoles) {
      const role = await Role.findOneAndUpdate(
        { name: roleData.name },
        roleData,
        { upsert: true, new: true, runValidators: true }
      );
      results.push(role);
    }

    return successResponse(
      res,
      "Default roles seeded successfully.",
      results,
      201
    );
  } catch (error) {
    next(error);
  }
};

const getAllRoles = async (req, res, next) => {
  try {
    const roles = await Role.find().sort({ name: 1 });
    return successResponse(res, "Roles fetched successfully.", roles);
  } catch (error) {
    next(error);
  }
};

const getRoleById = async (req, res, next) => {
  try {
    const role = await Role.findById(req.params.id);
    if (!role) return errorResponse(res, "Role not found.", 404);
    return successResponse(res, "Role fetched successfully.", role);
  } catch (error) {
    next(error);
  }
};

const createRole = async (req, res, next) => {
  try {
    const { name, permissions, description } = req.body;

    const existing = await Role.findOne({ name });
    if (existing)
      return errorResponse(res, `Role '${name}' already exists.`, 409);

    const role = await Role.create({ name, permissions, description });
    return successResponse(res, "Role created successfully.", role, 201);
  } catch (error) {
    next(error);
  }
};

const updateRole = async (req, res, next) => {
  try {
    const role = await Role.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!role) return errorResponse(res, "Role not found.", 404);
    return successResponse(res, "Role updated successfully.", role);
  } catch (error) {
    next(error);
  }
};

const deleteRole = async (req, res, next) => {
  try {
    const role = await Role.findByIdAndDelete(req.params.id);
    if (!role) return errorResponse(res, "Role not found.", 404);
    return successResponse(res, "Role deleted successfully.", role);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  seedRoles,
  getAllRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
};
