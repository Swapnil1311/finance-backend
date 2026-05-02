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

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management (admin only)
 */

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users (paginated)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Paginated list of users.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 *       403:
 *         description: Admin access required.
 */
router.get("/", protect, requireRole("admin"), getAllUsers);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get a user by ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User found.
 *       404:
 *         description: User not found.
 *       403:
 *         description: Admin access required.
 */
router.get(
  "/:id",
  protect,
  requireRole("admin"),
  mongoIdParam("id"),
  validate,
  getUserById
);

/**
 * @swagger
 * /api/users/{id}/role:
 *   put:
 *     summary: Update a user's role (e.g., promote to admin)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User MongoDB ObjectId
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateRoleInput'
 *     responses:
 *       200:
 *         description: Role updated.
 *       404:
 *         description: User or role not found.
 *       403:
 *         description: Insufficient permissions.
 */
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

/**
 * @swagger
 * /api/users/{id}/status:
 *   put:
 *     summary: Activate or deactivate a user account
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Status toggled.
 *       404:
 *         description: User not found.
 *       403:
 *         description: Insufficient permissions.
 */
router.put(
  "/:id/status",
  protect,
  requireRole("admin"),
  requirePermission("manage_users"),
  mongoIdParam("id"),
  validate,
  toggleUserStatus
);

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Soft-delete a user account
 *     description: Marks the user as deleted but retains the record for audit purposes.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User soft-deleted.
 *       404:
 *         description: User not found.
 *       403:
 *         description: Insufficient permissions.
 */
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
