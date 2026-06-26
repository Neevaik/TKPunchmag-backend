function errorHandler(err, req, res, next) {
    console.error("🔥 Error:", err);

    const statusCode = err.statusCode || 500;

    if (err.name === "ValidationError") {
        return res.status(400).json({
            ok: false,
            message: err.message,
        });
    }

    if (err.name === "JsonWebTokenError") {
        return res.status(401).json({
            ok: false,
            message: "❌ Invalid token",
        });
    }

    if (err.name === "TokenExpiredError") {
        return res.status(401).json({
            ok: false,
            message: "❌ Token expired",
        });
    }

    return res.status(statusCode).json({
        ok: false,
        message: err.message || "❌ Internal server error",
    });
}

module.exports = errorHandler;