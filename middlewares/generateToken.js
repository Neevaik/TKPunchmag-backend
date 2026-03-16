const jwt = require("jsonwebtoken");

async function generateToken(user) {
    const token = jwt.sign({
        id: user._id,
        role: user.role,
    },
        process.env.JWT_TOKEN_SECRET,
        { expiresIn: "1d" }
    );

    return token;
}

module.exports = { generateToken };