function errorHandler(err, req, res, next) {
  console.error("🔥 Error:", err.message);

  if (err.name === "ValidationError") {
    return res.status(400).json({ message: err.message });
  }

  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({ message: "❌ Invalid token" });
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json({ message: "❌ Token expired" });
  }

  return res.status(500).json({
    message: "❌ Internal server error"
  });
}

module.exports = errorHandler;
