const express = require("express");
const router = express.Router();

const {
  seedRoles,
  getAllRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
} = require("../controllers/RoleController");
const { protect } = require("../middlewares/authMiddleware");
const {
  requireRole,
  requirePermission,
} = require("../middlewares/rbacMiddleware");
const { createRoleValidator, mongoIdParam } = require("../validators");
const validate = require("../middlewares/validate");

router.post("/seed", seedRoles);

router.get("/", protect, requireRole("admin"), getAllRoles);

router.get(
  "/:id",
  protect,
  requireRole("admin"),
  mongoIdParam("id"),
  validate,
  getRoleById
);

router.post(
  "/",
  protect,
  requireRole("admin"),
  createRoleValidator,
  validate,
  createRole
);

router.put(
  "/:id",
  protect,
  requireRole("admin"),
  mongoIdParam("id"),
  validate,
  updateRole
);

router.delete(
  "/:id",
  protect,
  requireRole("admin"),
  mongoIdParam("id"),
  validate,
  deleteRole
);

module.exports = router;
