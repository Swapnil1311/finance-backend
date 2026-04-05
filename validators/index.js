const { body, param, query } = require("express-validator");
const Transaction = require("../models/TransactionModel");

// ─── Auth Validators ──────────────────────────────────────────────────────────

const registerValidator = [
  body("name")
    .trim()
    .notEmpty().withMessage("Name is required")
    .isLength({ min: 2, max: 50 }).withMessage("Name must be 2–50 characters"),

  body("email")
    .trim()
    .notEmpty().withMessage("Email is required")
    .isEmail().withMessage("Please provide a valid email")
    .normalizeEmail(),

  body("password")
    .notEmpty().withMessage("Password is required")
    .isLength({ min: 6 }).withMessage("Password must be at least 6 characters")
    .matches(/\d/).withMessage("Password must contain at least one number"),
];

const loginValidator = [
  body("email")
    .trim()
    .notEmpty().withMessage("Email is required")
    .isEmail().withMessage("Please provide a valid email")
    .normalizeEmail(),

  body("password")
    .notEmpty().withMessage("Password is required"),
];

// ─── Transaction Validators ───────────────────────────────────────────────────

const createTransactionValidator = [
  body("title")
    .trim()
    .notEmpty().withMessage("Title is required")
    .isLength({ min: 2, max: 100 }).withMessage("Title must be 2–100 characters"),

  body("amount")
    .notEmpty().withMessage("Amount is required")
    .isFloat({ min: 0.01 }).withMessage("Amount must be a positive number"),

  body("type")
    .notEmpty().withMessage("Type is required")
    .isIn(["income", "expense"]).withMessage("Type must be income or expense"),

  body("category")
    .notEmpty().withMessage("Category is required")
    .isIn(Transaction.schema.path("category").enumValues)
    .withMessage(`Invalid category`),

  body("date")
    .optional()
    .isISO8601().withMessage("Date must be a valid ISO 8601 date"),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage("Description cannot exceed 500 characters"),

  body("tags")
    .optional()
    .isArray().withMessage("Tags must be an array"),
];

const updateTransactionValidator = [
  param("id")
    .isMongoId().withMessage("Invalid transaction ID"),

  body("title")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage("Title must be 2–100 characters"),

  body("amount")
    .optional()
    .isFloat({ min: 0.01 }).withMessage("Amount must be a positive number"),

  body("type")
    .optional()
    .isIn(["income", "expense"]).withMessage("Type must be income or expense"),

  body("category")
    .optional()
    .isIn(Transaction.schema.path("category").enumValues)
    .withMessage(`Invalid category`),

  body("date")
    .optional()
    .isISO8601().withMessage("Date must be a valid ISO 8601 date"),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage("Description cannot exceed 500 characters"),
];

// ─── Role Validators ──────────────────────────────────────────────────────────

const createRoleValidator = [
  body("name")
    .notEmpty().withMessage("Role name is required")
    .isIn(["viewer", "analyst", "admin"]).withMessage("Role must be viewer, analyst, or admin"),

  body("permissions")
    .optional()
    .isArray().withMessage("Permissions must be an array")
    .custom((perms) => {
      const valid = ["read", "write", "delete", "manage_users"];
      const invalid = perms.filter((p) => !valid.includes(p));
      if (invalid.length > 0) throw new Error(`Invalid permissions: ${invalid.join(", ")}`);
      return true;
    }),
];

const updateRoleValidator = [
  body("role")
    .notEmpty().withMessage("Role ID is required")
    .isMongoId().withMessage("Invalid Role ID"),
];

// ─── Param Validators ─────────────────────────────────────────────────────────

const mongoIdParam = (paramName = "id") => [
  param(paramName)
    .isMongoId().withMessage(`Invalid ${paramName} format`),
];

// ─── Query Validators (for filtering/pagination) ──────────────────────────────

const transactionQueryValidator = [
  query("page").optional().isInt({ min: 1 }).withMessage("Page must be a positive integer"),
  query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("Limit must be 1–100"),
  query("type").optional().isIn(["income", "expense"]).withMessage("Type must be income or expense"),
  query("category").optional().isIn(Transaction.schema.path("category").enumValues),
  query("startDate").optional().isISO8601().withMessage("startDate must be ISO 8601"),
  query("endDate").optional().isISO8601().withMessage("endDate must be ISO 8601"),
  query("minAmount").optional().isFloat({ min: 0 }).withMessage("minAmount must be >= 0"),
  query("maxAmount").optional().isFloat({ min: 0 }).withMessage("maxAmount must be >= 0"),
];

module.exports = {
  registerValidator,
  loginValidator,
  createTransactionValidator,
  updateTransactionValidator,
  createRoleValidator,
  updateRoleValidator,
  mongoIdParam,
  transactionQueryValidator,
};
