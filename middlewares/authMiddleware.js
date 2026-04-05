const jwt = require("jsonwebtoken");
const User = require("../models/UserModel");

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Access denied. No token provided. Please log in.",
        flag: -1,
      });
    }

    const token = authHeader.split(" ")[1];

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({
          message: "Token expired. Please log in again.",
          flag: -1,
        });
      }
      return res.status(401).json({
        message: "Invalid token. Please log in again.",
        flag: -1,
      });
    }

    const user = await User.findById(decoded.id).populate("role");

    if (!user) {
      return res.status(401).json({
        message: "User no longer exists.",
        flag: -1,
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        message: "Your account has been deactivated. Contact an admin.",
        flag: -1,
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(500).json({
      message: "Authentication error",
      flag: -1,
      error: error.message,
    });
  }
};

module.exports = { protect };
