const jwt = require("jsonwebtoken");
const User = require("../models/User");

async function generateAccessToken(refreshToken) {
    try {
        const decodedRefreshToken = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        const user = await User.findById(decodedRefreshToken.id);
        const accessToken = jwt.sign({
            id: user._id,
            username: user.username
        },
            process.env.JWT_SECRET,
            { expiresIn: "15m" }
        );

        return accessToken;

    } catch (error) {
        return {
            valid: false,
            reason: error
        }
    }
}

async function generateRefreshToken(user) {
    const token = jwt.sign({
        id: user._id,
    },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: "7d" }
    );

    return token;
}

module.exports = { generateAccessToken, generateRefreshToken };