const User = require("../models/User");

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

module.exports = { verifyExistingUser };