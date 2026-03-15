const jwt = require("jsonwebtoken");
const User = require("../models/User");

function verifyToken(req, res, next) {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({ message: "❌ No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_TOKEN_SECRET);

    req.userId = decoded.id;

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "❌ Token expired" });
    }
    return res.status(401).json({ message: "❌ Invalid token" });
  }
}

function verifyBody(requiredFields) {
  return (req, res, next) => {
    const missingFields = requiredFields.filter(field => !req.body[field]);
    if (missingFields.length > 0) {
      return res.status(400).json({ message: `Missing field : ${missingFields.join(", ")}` });
    }
    next();
  }
}

module.exports = { verifyBody, verifyToken };