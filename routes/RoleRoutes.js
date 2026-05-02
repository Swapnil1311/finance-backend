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

/**
 * @swagger
 * tags:
 *   name: Roles
 *   description: Role management (admin only, except seed)
 */

/**
 * @swagger
 * /api/roles/seed:
 *   post:
 *     summary: Seed default roles (viewer, analyst, admin)
 *     description: One-time setup endpoint. Creates the three default roles if they don't exist. Safe to call multiple times (uses upsert).
 *     tags: [Roles]
 *     responses:
 *       201:
 *         description: Default roles seeded successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.post("/seed", seedRoles);

/**
 * @swagger
 * /api/roles:
 *   get:
 *     summary: Get all roles
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all roles.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         description: Not authenticated.
 *       403:
 *         description: Admin access required.
 */
router.get("/", protect, requireRole("admin"), getAllRoles);

/**
 * @swagger
 * /api/roles/{id}:
 *   get:
 *     summary: Get a role by ID
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Role MongoDB ObjectId
 *     responses:
 *       200:
 *         description: Role found.
 *       404:
 *         description: Role not found.
 *       403:
 *         description: Admin access required.
 */
router.get(
  "/:id",
  protect,
  requireRole("admin"),
  mongoIdParam("id"),
  validate,
  getRoleById
);

/**
 * @swagger
 * /api/roles:
 *   post:
 *     summary: Create a new role
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateRoleInput'
 *     responses:
 *       201:
 *         description: Role created.
 *       400:
 *         description: Validation failed.
 *       403:
 *         description: Admin access required.
 *       409:
 *         description: Role with this name already exists.
 */
router.post(
  "/",
  protect,
  requireRole("admin"),
  createRoleValidator,
  validate,
  createRole
);

/**
 * @swagger
 * /api/roles/{id}:
 *   put:
 *     summary: Update a role
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: [read, write]
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Role updated.
 *       404:
 *         description: Role not found.
 *       403:
 *         description: Admin access required.
 */
router.put(
  "/:id",
  protect,
  requireRole("admin"),
  mongoIdParam("id"),
  validate,
  updateRole
);

/**
 * @swagger
 * /api/roles/{id}:
 *   delete:
 *     summary: Delete a role
 *     tags: [Roles]
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
 *         description: Role deleted.
 *       404:
 *         description: Role not found.
 *       403:
 *         description: Admin access required.
 */
router.delete(
  "/:id",
  protect,
  requireRole("admin"),
  mongoIdParam("id"),
  validate,
  deleteRole
);

module.exports = router;
