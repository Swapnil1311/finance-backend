const Transaction = require("../models/TransactionModel");
const {
  successResponse,
  errorResponse,
  paginatedResponse,
  buildPagination,
  parsePagination,
} = require("../utils/responseHelper");

const createTransaction = async (req, res, next) => {
  try {
    const transaction = await Transaction.create({
      ...req.body,
      createdBy: req.user._id,
    });

    await transaction.populate("createdBy", "name email");

    return successResponse(
      res,
      "Transaction created successfully.",
      transaction,
      201
    );
  } catch (error) {
    next(error);
  }
};

const getAllTransactions = async (req, res, next) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const {
      type,
      category,
      startDate,
      endDate,
      minAmount,
      maxAmount,
      search,
      tags,
      sortBy = "date",
      sortOrder = "desc",
    } = req.query;

    const filter = {};

    if (type) filter.type = type;
    if (category) filter.category = category;

    // Date range filter
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    // Amount range filter
    if (minAmount || maxAmount) {
      filter.amount = {};
      if (minAmount) filter.amount.$gte = parseFloat(minAmount);
      if (maxAmount) filter.amount.$lte = parseFloat(maxAmount);
    }

    // Tags filter (comma-separated: ?tags=monthly,q1)
    if (tags) {
      const tagArray = tags.split(",").map((t) => t.trim());
      filter.tags = { $in: tagArray };
    }

    // Full-text search on title, description, tags
    if (search) {
      filter.$text = { $search: search };
    }

    const validSortFields = ["date", "amount", "createdAt", "title"];
    const sortField = validSortFields.includes(sortBy) ? sortBy : "date";
    const sort = { [sortField]: sortOrder === "asc" ? 1 : -1 };

    const [transactions, total] = await Promise.all([
      Transaction.find(filter)
        .populate("createdBy", "name email")
        .populate("updatedBy", "name email")
        .skip(skip)
        .limit(limit)
        .sort(sort),
      Transaction.countDocuments(filter),
    ]);

    return paginatedResponse(
      res,
      "Transactions fetched successfully.",
      transactions,
      buildPagination(total, page, limit)
    );
  } catch (error) {
    next(error);
  }
};

const getTransactionById = async (req, res, next) => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email");

    if (!transaction) return errorResponse(res, "Transaction not found.", 404);

    return successResponse(
      res,
      "Transaction fetched successfully.",
      transaction
    );
  } catch (error) {
    next(error);
  }
};

const updateTransaction = async (req, res, next) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) return errorResponse(res, "Transaction not found.", 404);

    const isAdmin = req.user.role.name === "admin";
    const isOwner =
      transaction.createdBy.toString() === req.user._id.toString();

    if (!isAdmin && !isOwner) {
      return errorResponse(
        res,
        "You can only update your own transactions.",
        403
      );
    }

    const updated = await Transaction.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        updatedBy: req.user._id,
      },
      { new: true, runValidators: true }
    )
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email");

    return successResponse(res, "Transaction updated successfully.", updated);
  } catch (error) {
    next(error);
  }
};

const deleteTransaction = async (req, res, next) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) return errorResponse(res, "Transaction not found.", 404);

    await transaction.softDelete(req.user._id);

    return successResponse(res, "Transaction deleted (soft) successfully.", {
      _id: transaction._id,
      title: transaction.title,
      deletedAt: transaction.deletedAt,
    });
  } catch (error) {
    next(error);
  }
};

const getDeletedTransactions = async (req, res, next) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const [result] = await Transaction.aggregate([
      { $match: { isDeleted: true } },
      {
        $facet: {
          transactions: [
            { $sort: { deletedAt: -1, createdAt: -1 } },
            { $skip: skip },
            { $limit: limit },
            {
              $lookup: {
                from: "users",
                localField: "createdBy",
                foreignField: "_id",
                as: "createdBy",
                pipeline: [{ $project: { name: 1, email: 1 } }],
              },
            },
            {
              $lookup: {
                from: "users",
                localField: "deletedBy",
                foreignField: "_id",
                as: "deletedBy",
                pipeline: [{ $project: { name: 1, email: 1 } }],
              },
            },
            {
              $unwind: {
                path: "$createdBy",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $unwind: {
                path: "$deletedBy",
                preserveNullAndEmptyArrays: true,
              },
            },
          ],
          totalCount: [{ $count: "count" }],
        },
      },
    ]);

    const transactions = result.transactions;
    const total = result.totalCount[0]?.count || 0;

    return paginatedResponse(
      res,
      "Deleted transactions fetched.",
      transactions,
      buildPagination(total, page, limit)
    );
  } catch (error) {
    next(error);
  }
};

const restoreTransaction = async (req, res, next) => {
  try {
    const result = await Transaction.updateOne(
      { _id: req.params.id, isDeleted: true },
      { isDeleted: false, deletedAt: null, deletedBy: null }
    );

    if (result.matchedCount === 0) {
      return errorResponse(res, "Deleted transaction not found.", 404);
    }

    const restored = await Transaction.findById(req.params.id).populate(
      "createdBy",
      "name email"
    );

    return successResponse(res, "Transaction restored successfully.", restored);
  } catch (error) {
    next(error);
  }
};

const getCategories = async (req, res, next) => {
  try {
    return successResponse(
      res,
      "Categories fetched successfully.",
      Transaction.CATEGORIES
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTransaction,
  getAllTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
  getDeletedTransactions,
  restoreTransaction,
  getCategories,
};
