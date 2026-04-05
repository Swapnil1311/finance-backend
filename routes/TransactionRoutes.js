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

router.get("/categories", protect, requirePermission("read"), getCategories);

router.get("/deleted", protect, requireRole("admin"), getDeletedTransactions);

router.get(
  "/",
  protect,
  requirePermission("read"),
  transactionQueryValidator,
  validate,
  getAllTransactions
);

router.post(
  "/",
  protect,
  requirePermission("write"),
  createTransactionValidator,
  validate,
  createTransaction
);

router.get(
  "/:id",
  protect,
  requirePermission("read"),
  mongoIdParam("id"),
  validate,
  getTransactionById
);

router.put(
  "/:id",
  protect,
  requirePermission("write"),
  updateTransactionValidator,
  validate,
  updateTransaction
);

router.delete(
  "/:id",
  protect,
  requirePermission("delete"),
  mongoIdParam("id"),
  validate,
  deleteTransaction
);

router.put(
  "/:id/restore",
  protect,
  requireRole("admin"),
  mongoIdParam("id"),
  validate,
  restoreTransaction
);

module.exports = router;
