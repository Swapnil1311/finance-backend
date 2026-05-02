const express = require("express");
const router = express.Router();

const {
  getSummary,
  getByCategory,
  getMonthlyTrend,
  getRecentActivity,
  getTopExpenses,
  getOverview,
} = require("../controllers/DashboardController");
const { protect } = require("../middlewares/authMiddleware");
const { requirePermission } = require("../middlewares/rbacMiddleware");

/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: Aggregated analytics and dashboard data
 */

/**
 * @swagger
 * /api/dashboard/overview:
 *   get:
 *     summary: Get a complete dashboard overview
 *     description: Returns combined summary, recent activity, top expenses, and category breakdown in one call.
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard overview data.
 *       401:
 *         description: Not authenticated.
 */
router.get("/overview", protect, requirePermission("read"), getOverview);

/**
 * @swagger
 * /api/dashboard/summary:
 *   get:
 *     summary: Get total income, expenses, and net balance
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Summary statistics.
 */
router.get("/summary", protect, requirePermission("read"), getSummary);

/**
 * @swagger
 * /api/dashboard/by-category:
 *   get:
 *     summary: Get spending breakdown by category
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Category breakdown data.
 */
router.get("/by-category", protect, requirePermission("read"), getByCategory);

/**
 * @swagger
 * /api/dashboard/monthly-trend:
 *   get:
 *     summary: Get monthly income/expense trend
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Monthly trend data over time.
 */
router.get(
  "/monthly-trend",
  protect,
  requirePermission("read"),
  getMonthlyTrend
);

/**
 * @swagger
 * /api/dashboard/recent:
 *   get:
 *     summary: Get most recent transactions
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Recent activity list.
 */
router.get("/recent", protect, requirePermission("read"), getRecentActivity);

/**
 * @swagger
 * /api/dashboard/top-expenses:
 *   get:
 *     summary: Get top expense transactions
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Top expenses list.
 */
router.get("/top-expenses", protect, requirePermission("read"), getTopExpenses);

module.exports = router;
