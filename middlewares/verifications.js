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
      role: decoded.role
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

function isAdmin(req, res, next) {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Forbidden" })
  }
  next()
}

module.exports = { verifyBody, verifyToken, isAdmin };