const Transaction = require("../models/TransactionModel");
const { successResponse, errorResponse } = require("../utils/responseHelper");

const getSummary = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const dateFilter = buildDateFilter(startDate, endDate);

    const result = await Transaction.aggregate([
      { $match: { isDeleted: { $ne: true }, ...dateFilter } },
      {
        $group: {
          _id: "$type",
          total: { $sum: "$amount" },
          count: { $sum: 1 },
          avgAmount: { $avg: "$amount" },
          maxAmount: { $max: "$amount" },
          minAmount: { $min: "$amount" },
        },
      },
    ]);

    const summary = {
      income: { total: 0, count: 0, avg: 0, max: 0, min: 0 },
      expense: { total: 0, count: 0, avg: 0, max: 0, min: 0 },
    };

    result.forEach(({ _id, total, count, avgAmount, maxAmount, minAmount }) => {
      summary[_id] = {
        total: +total.toFixed(2),
        count,
        avg: +avgAmount.toFixed(2),
        max: +maxAmount.toFixed(2),
        min: +minAmount.toFixed(2),
      };
    });

    const balance = +(summary.income.total - summary.expense.total).toFixed(2);
    const savingsRate =
      summary.income.total > 0
        ? +(
            ((summary.income.total - summary.expense.total) /
              summary.income.total) *
            100
          ).toFixed(2)
        : 0;

    return successResponse(res, "Summary fetched successfully.", {
      balance,
      savingsRate: `${savingsRate}%`,
      income: summary.income,
      expense: summary.expense,
      ...(startDate || endDate ? { period: { startDate, endDate } } : {}),
    });
  } catch (error) {
    next(error);
  }
};

const getByCategory = async (req, res, next) => {
  try {
    const { startDate, endDate, type } = req.query;

    const matchStage = {
      isDeleted: { $ne: true },
      ...buildDateFilter(startDate, endDate),
    };
    if (type) matchStage.type = type;

    const result = await Transaction.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: { category: "$category", type: "$type" },
          total: { $sum: "$amount" },
          count: { $sum: 1 },
          avgAmount: { $avg: "$amount" },
        },
      },
      { $sort: { total: -1 } },
      {
        $group: {
          _id: "$_id.type",
          categories: {
            $push: {
              category: "$_id.category",
              total: { $round: ["$total", 2] },
              count: "$count",
              avg: { $round: ["$avgAmount", 2] },
            },
          },
          typeTotal: { $sum: "$total" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const formatted = result.map(({ _id, categories, typeTotal }) => ({
      type: _id,
      total: +typeTotal.toFixed(2),
      categories: categories.map((cat) => ({
        ...cat,
        percentage:
          typeTotal > 0 ? +((cat.total / typeTotal) * 100).toFixed(2) : 0,
      })),
    }));

    return successResponse(
      res,
      "Category breakdown fetched successfully.",
      formatted
    );
  } catch (error) {
    next(error);
  }
};

const getMonthlyTrend = async (req, res, next) => {
  try {
    const { year = new Date().getFullYear() } = req.query;

    const startOfYear = new Date(`${year}-01-01`);
    const endOfYear = new Date(`${year}-12-31T23:59:59`);

    const result = await Transaction.aggregate([
      {
        $match: {
          isDeleted: { $ne: true },
          date: { $gte: startOfYear, $lte: endOfYear },
        },
      },
      {
        $group: {
          _id: {
            month: { $month: "$date" },
            type: "$type",
          },
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.month": 1 } },
    ]);

    const months = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      monthName: new Date(year, i, 1).toLocaleString("default", {
        month: "long",
      }),
      income: 0,
      expense: 0,
      balance: 0,
    }));

    result.forEach(({ _id, total }) => {
      const monthData = months[_id.month - 1];
      monthData[_id.type] = +total.toFixed(2);
    });

    months.forEach((m) => {
      m.balance = +(m.income - m.expense).toFixed(2);
    });

    return successResponse(res, "Monthly trend fetched successfully.", {
      year: parseInt(year),
      months,
    });
  } catch (error) {
    next(error);
  }
};

const getRecentActivity = async (req, res, next) => {
  try {
    const limit = Math.min(50, parseInt(req.query.limit) || 10);

    const transactions = await Transaction.find()
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 })
      .limit(limit);

    return successResponse(res, "Recent transactions fetched.", transactions);
  } catch (error) {
    next(error);
  }
};

const getTopExpenses = async (req, res, next) => {
  try {
    const { limit: limitParam = 5, startDate, endDate } = req.query;
    const limit = Math.min(15, parseInt(limitParam));

    const result = await Transaction.aggregate([
      {
        $match: {
          isDeleted: { $ne: true },
          type: "expense",
          ...buildDateFilter(startDate, endDate),
        },
      },
      {
        $group: {
          _id: "$category",
          total: { $sum: "$amount" },
          count: { $sum: 1 },
          transactions: {
            $push: { title: "$title", amount: "$amount", date: "$date" },
          },
        },
      },
      { $sort: { total: -1 } },
      { $limit: limit },
      {
        $project: {
          category: "$_id",
          total: { $round: ["$total", 2] },
          count: 1,
          topTransactions: { $slice: ["$transactions", 3] },
          _id: 0,
        },
      },
    ]);

    return successResponse(res, "Top expenses fetched successfully.", result);
  } catch (error) {
    next(error);
  }
};

const getOverview = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const dateFilter = buildDateFilter(startDate, endDate);
    const matchBase = { isDeleted: { $ne: true }, ...dateFilter };

    const [summaryRaw, categoryRaw, recentRaw, monthlyRaw] = await Promise.all([
      Transaction.aggregate([
        { $match: matchBase },
        {
          $group: {
            _id: "$type",
            total: { $sum: "$amount" },
            count: { $sum: 1 },
          },
        },
      ]),

      Transaction.aggregate([
        { $match: matchBase },
        {
          $group: {
            _id: { cat: "$category", type: "$type" },
            total: { $sum: "$amount" },
          },
        },
        { $sort: { total: -1 } },
        {
          $group: {
            _id: "$_id.type",
            categories: {
              $push: { category: "$_id.cat", total: { $round: ["$total", 2] } },
            },
          },
        },
      ]),

      Transaction.find(dateFilter)
        .populate("createdBy", "name")
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),

      Transaction.aggregate([
        {
          $match: {
            isDeleted: { $ne: true },
            date: {
              $gte: new Date(
                new Date().getFullYear(),
                new Date().getMonth() - 1,
                1
              ),
            },
          },
        },
        {
          $group: {
            _id: {
              month: { $month: "$date" },
              year: { $year: "$date" },
              type: "$type",
            },
            total: { $sum: "$amount" },
          },
        },
      ]),
    ]);

    const summary = {
      income: { total: 0, count: 0 },
      expense: { total: 0, count: 0 },
    };
    summaryRaw.forEach(({ _id, total, count }) => {
      summary[_id] = { total: +total.toFixed(2), count };
    });
    const balance = +(summary.income.total - summary.expense.total).toFixed(2);

    const categories = {};
    categoryRaw.forEach(({ _id, categories: cats }) => {
      categories[_id] = cats.slice(0, 5);
    });

    const now = new Date();
    const thisMonth = now.getMonth() + 1;
    const lastMonth = thisMonth === 1 ? 12 : thisMonth - 1;
    const thisYear = now.getFullYear();
    const lastMonthYear = thisMonth === 1 ? thisYear - 1 : thisYear;

    const monthComparison = {
      thisMonth: { income: 0, expense: 0 },
      lastMonth: { income: 0, expense: 0 },
    };
    monthlyRaw.forEach(({ _id, total }) => {
      if (_id.month === thisMonth && _id.year === thisYear) {
        monthComparison.thisMonth[_id.type] = +total.toFixed(2);
      } else if (_id.month === lastMonth && _id.year === lastMonthYear) {
        monthComparison.lastMonth[_id.type] = +total.toFixed(2);
      }
    });

    return successResponse(res, "Dashboard overview fetched successfully.", {
      summary: { ...summary, balance },
      categories,
      recentTransactions: recentRaw,
      monthComparison,
    });
  } catch (error) {
    next(error);
  }
};

const buildDateFilter = (startDate, endDate) => {
  if (!startDate && !endDate) return {};
  const filter = { date: {} };
  if (startDate) filter.date.$gte = new Date(startDate);
  if (endDate) filter.date.$lte = new Date(endDate);
  return filter;
};

module.exports = {
  getSummary,
  getByCategory,
  getMonthlyTrend,
  getRecentActivity,
  getTopExpenses,
  getOverview,
};
