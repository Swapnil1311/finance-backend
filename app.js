require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const swaggerUi = require("swagger-ui-express");

const connectDB = require("./config/db");
const swaggerSpec = require("./config/swagger");
const { apiLimiter } = require("./middlewares/rateLimiter");
const { errorHandler, notFound } = require("./middlewares/errorMiddleware");

// ── Route imports ──────────────────────────────────────────────────────────────
const authRoutes = require("./routes/AuthRoutes");
const roleRoutes = require("./routes/RoleRoutes");
const userRoutes = require("./routes/UserRoutes");
const transactionRoutes = require("./routes/TransactionRoutes");
const dashboardRoutes = require("./routes/DashboardRoutes");

// ── Connect to DB ──────────────────────────────────────────────────────────────
connectDB();

const app = express();

// ── Global Middleware ──────────────────────────────────────────────────────────
// CORS — supports multiple comma-separated origins via CLIENT_URL env var
const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(",").map((o) => o.trim())
  : ["*"];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (Postman, server-to-server, mobile apps)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes("*") || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS: Origin ${origin} not allowed`));
  },
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));

app.use(express.json({ limit: "10kb" }));        // Reject oversized payloads
app.use(express.urlencoded({ extended: true }));

// HTTP request logger — dev format locally, compact format in production
if (process.env.NODE_ENV === "production") {
  app.use(morgan("combined"));
} else {
  app.use(morgan("dev"));
}

// Global rate limiter on all /api routes
app.use("/api", apiLimiter);

// ── Swagger UI ─────────────────────────────────────────────────────────────────
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customSiteTitle: "Finance API Docs",
    customCss: ".swagger-ui .topbar { background-color: #1a1a2e; }",
    swaggerOptions: {
      persistAuthorization: true, // Keep JWT token across page refreshes
      displayRequestDuration: true,
    },
  })
);

// Expose raw spec as JSON (useful for Postman collection generation)
app.get("/api-docs.json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});

// ── Health Check ───────────────────────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "Finance Backend is running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: "1.0.0",
  });
});

// ── API Routes ─────────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/roles", roleRoutes);
app.use("/api/users", userRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/dashboard", dashboardRoutes);

// ── 404 & Error Handlers — must be LAST ───────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ── Start Server ───────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  console.log(`📋 API Docs:   http://localhost:${PORT}/api-docs`);
  console.log(`❤️  Health:     http://localhost:${PORT}/health`);
  console.log(`📄 Spec JSON:  http://localhost:${PORT}/api-docs.json\n`);
});

// Handle unhandled promise rejections (safety net)
process.on("unhandledRejection", (reason, promise) => {
  console.error("⚠️  Unhandled Rejection:", reason);
  // In production you'd want to gracefully shut down here
});
