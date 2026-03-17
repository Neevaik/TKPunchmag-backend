const jwt = require("jsonwebtoken");
const User = require("../models/User");

function verifyToken(req, res, next) {
  try {
    const token = req.cookies?.token;
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
    const missingFields = requiredFields.filter(field => !req.body[field]);
    if (missingFields.length > 0) {
      return res.status(400).json({
        ok: false,
        message: `Missing field : ${missingFields.join(", ")}`
      });
    }
    next();
  }
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

module.exports = { verifyBody, verifyToken, requireRole };