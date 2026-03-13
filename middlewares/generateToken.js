const jwt = require("jsonwebtoken");

async function generateToken(user) {
    const token = jwt.sign({
        id: user._id,
    },
        process.env.JWT_TOKEN_SECRET,
        { expiresIn: "5m" }
    );

    return token;
}

module.exports = { generateToken };