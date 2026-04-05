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

router.get("/overview", protect, requirePermission("read"), getOverview);

router.get("/summary", protect, requirePermission("read"), getSummary);

router.get("/by-category", protect, requirePermission("read"), getByCategory);

router.get(
  "/monthly-trend",
  protect,
  requirePermission("read"),
  getMonthlyTrend
);

router.get("/recent", protect, requirePermission("read"), getRecentActivity);

router.get("/top-expenses", protect, requirePermission("read"), getTopExpenses);

module.exports = router;
