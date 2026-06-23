const jwt = require("jsonwebtoken");
const User = require("../models/User");

function verifyToken(req, res, next) {
  try {
    console.log("=== DEBUG COOKIE ===");
    console.log("headers.cookie:", req.headers.cookie);
    console.log("req.cookies:", req.cookies);
    console.log("====================");
    const token = req.cookies?.token || req.headers?.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({
        ok: false,
        message: "No authentication token"
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_TOKEN_SECRET);
    req.user = {
      id: decoded.id,
    };

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        ok: false,
        message: "Token expired"
      });
    }

    return res.status(401).json({
      ok: false,
      message: "Invalid token"
    });
  }
}

function verifyBody(requiredFields) {
  return (req, res, next) => {
    const errors = [];

    for (const field of requiredFields) {
      const value = req.body[field];

      if (value === undefined || value === null) {
        errors.push(`"${field}" is required`);
        continue;
      }

      if (typeof value === "string" && !value.trim()) {
        errors.push(`"${field}" cannot be empty`);
        continue;
      }

      if (typeof value === "number" && isNaN(value)) {
        errors.push(`"${field}" must be a valid number`);
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        ok: false,
        message: "❌ Validation failed",
        errors
      });
    }

    next();
  };
}

function requireRole(...roles) {
  return async (req, res, next) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({
          ok: false,
          message: "Unauthorized"
        });
      }

      const user = await User.findById(req.user.id).select("_id role");

      if (!user) {
        return res.status(401).json({
          ok: false,
          message: "User not found"
        });
      }

      if (!roles.includes(user.role)) {
        return res.status(403).json({
          ok: false,
          message: "Forbidden"
        });
      }

      req.user = {
        id: user._id.toString(),
        role: user.role
      };

      next();
    } catch (error) {
      return res.status(500).json({
        ok: false,
        message: "Server error"
      });
    }
  };
}

async function verifyExistingUser(req, res, next) {
  try {
    let { username } = req.body;

    username = username.trim();
    if (!username) {
      return res.status(400).json({
        ok: false,
        message: "❌ Username is required"
      });
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(409).json({
        ok: false,
        message: "❌ Username already exists"
      });
    }

    next();
  } catch (error) {
    next(error);
  }
}

module.exports = { verifyBody, verifyToken, requireRole, verifyExistingUser };