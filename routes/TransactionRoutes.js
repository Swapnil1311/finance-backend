const express = require("express");
const router = express.Router();

const {
  createTransaction,
  getAllTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
  getDeletedTransactions,
  restoreTransaction,
  getCategories,
} = require("../controllers/TransactionController");
const { protect } = require("../middlewares/authMiddleware");
const {
  requirePermission,
  requireRole,
} = require("../middlewares/rbacMiddleware");
const {
  createTransactionValidator,
  updateTransactionValidator,
  transactionQueryValidator,
  mongoIdParam,
} = require("../validators");
const validate = require("../middlewares/validate");

/**
 * @swagger
 * tags:
 *   name: Transactions
 *   description: Financial transaction management with role-based access
 */

/**
 * @swagger
 * /api/transactions/categories:
 *   get:
 *     summary: Get list of distinct categories
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of unique categories used in transactions.
 *       401:
 *         description: Not authenticated.
 */
router.get("/categories", protect, requirePermission("read"), getCategories);

/**
 * @swagger
 * /api/transactions/deleted:
 *   get:
 *     summary: Get all soft-deleted transactions (admin only)
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of soft-deleted transactions.
 *       403:
 *         description: Admin access required.
 */
router.get("/deleted", protect, requireRole("admin"), getDeletedTransactions);

/**
 * @swagger
 * /api/transactions:
 *   get:
 *     summary: Get all transactions (paginated, filterable)
 *     tags: [Transactions]
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
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [income, expense]
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Paginated list of transactions.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 */
router.get(
  "/",
  protect,
  requirePermission("read"),
  transactionQueryValidator,
  validate,
  getAllTransactions
);

/**
 * @swagger
 * /api/transactions:
 *   post:
 *     summary: Create a new transaction
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateTransactionInput'
 *     responses:
 *       201:
 *         description: Transaction created.
 *       400:
 *         description: Validation failed.
 *       403:
 *         description: Write permission required.
 */
router.post(
  "/",
  protect,
  requirePermission("write"),
  createTransactionValidator,
  validate,
  createTransaction
);

/**
 * @swagger
 * /api/transactions/{id}:
 *   get:
 *     summary: Get a transaction by ID
 *     tags: [Transactions]
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
 *         description: Transaction found.
 *       404:
 *         description: Transaction not found.
 */
router.get(
  "/:id",
  protect,
  requirePermission("read"),
  mongoIdParam("id"),
  validate,
  getTransactionById
);

/**
 * @swagger
 * /api/transactions/{id}:
 *   put:
 *     summary: Update a transaction
 *     tags: [Transactions]
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
 *             $ref: '#/components/schemas/CreateTransactionInput'
 *     responses:
 *       200:
 *         description: Transaction updated.
 *       404:
 *         description: Transaction not found.
 *       403:
 *         description: Write permission required.
 */
router.put(
  "/:id",
  protect,
  requirePermission("write"),
  updateTransactionValidator,
  validate,
  updateTransaction
);

/**
 * @swagger
 * /api/transactions/{id}:
 *   delete:
 *     summary: Soft-delete a transaction
 *     tags: [Transactions]
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
 *         description: Transaction soft-deleted.
 *       404:
 *         description: Transaction not found.
 *       403:
 *         description: Delete permission required.
 */
router.delete(
  "/:id",
  protect,
  requirePermission("delete"),
  mongoIdParam("id"),
  validate,
  deleteTransaction
);

/**
 * @swagger
 * /api/transactions/{id}/restore:
 *   put:
 *     summary: Restore a soft-deleted transaction (admin only)
 *     tags: [Transactions]
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
 *         description: Transaction restored.
 *       404:
 *         description: Transaction not found.
 *       403:
 *         description: Admin access required.
 */
router.put(
  "/:id/restore",
  protect,
  requireRole("admin"),
  mongoIdParam("id"),
  validate,
  restoreTransaction
);

module.exports = router;
