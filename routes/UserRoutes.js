const express = require("express");
const router = express.Router();

const {
  getAllUsers,
  getUserById,
  updateUserRole,
  toggleUserStatus,
  deleteUser,
} = require("../controllers/UserController");
const { protect } = require("../middlewares/authMiddleware");
const {
  requireRole,
  requirePermission,
} = require("../middlewares/rbacMiddleware");
const { updateRoleValidator, mongoIdParam } = require("../validators");
const validate = require("../middlewares/validate");

router.get("/", protect, requireRole("admin"), getAllUsers);

router.get(
  "/:id",
  protect,
  requireRole("admin"),
  mongoIdParam("id"),
  validate,
  getUserById
);

router.put(
  "/:id/role",
  protect,
  requireRole("admin"),
  requirePermission("manage_users"),
  mongoIdParam("id"),
  updateRoleValidator,
  validate,
  updateUserRole
);

router.put(
  "/:id/status",
  protect,
  requireRole("admin"),
  requirePermission("manage_users"),
  mongoIdParam("id"),
  validate,
  toggleUserStatus
);

router.delete(
  "/:id",
  protect,
  requireRole("admin"),
  requirePermission("manage_users"),
  mongoIdParam("id"),
  validate,
  deleteUser
);

module.exports = router;
