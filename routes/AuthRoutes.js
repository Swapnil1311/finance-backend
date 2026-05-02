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

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: User registration, login, and account management
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     description: Creates a new user account. Defaults to "viewer" role unless a different role is specified.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterInput'
 *     responses:
 *       201:
 *         description: Registration successful, returns JWT token and user info.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Validation failed.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: Email already registered.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       429:
 *         description: Too many registration attempts. Try again later.
 */
router.post("/register", authLimiter, registerValidator, validate, register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Log in an existing user
 *     description: Authenticates a user and returns a JWT token.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginInput'
 *     responses:
 *       200:
 *         description: Login successful.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description: Invalid email or password.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Account deactivated.
 *       429:
 *         description: Too many login attempts.
 */
router.post("/login", authLimiter, loginValidator, validate, login);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get the current logged-in user's profile
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         description: Not authenticated (missing or invalid token).
 */
router.get("/me", protect, getMe);

/**
 * @swagger
 * /api/auth/change-password:
 *   put:
 *     summary: Change current user's password
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 example: OldPass123
 *               newPassword:
 *                 type: string
 *                 example: NewPass456
 *     responses:
 *       200:
 *         description: Password changed successfully.
 *       400:
 *         description: Current password is incorrect.
 *       401:
 *         description: Not authenticated.
 */
router.put("/change-password", protect, changePassword);

module.exports = router;
