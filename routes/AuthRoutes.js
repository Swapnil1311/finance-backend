const express = require("express");
const router = express.Router();

const {
  register,
  login,
  getMe,
  changePassword,
} = require("../controllers/AuthController");
const { protect } = require("../middlewares/authMiddleware");
const { authLimiter } = require("../middlewares/rateLimiter");
const { registerValidator, loginValidator } = require("../validators");
const validate = require("../middlewares/validate");

router.post("/register", authLimiter, registerValidator, validate, register);

router.post("/login", authLimiter, loginValidator, validate, login);

router.get("/me", protect, getMe);

router.put("/change-password", protect, changePassword);

module.exports = router;
