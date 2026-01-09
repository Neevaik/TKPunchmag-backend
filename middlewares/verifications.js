const jwt = require("jsonwebtoken");
const User = require("../models/User");

function verifyToken(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) { return res.status(401).json({ message: "❌No token" }); }

    const token = authHeader.split(" ")[1];

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) { return res.status(401).json({ message: "Invalid token" }); }
        console.log("decoded : ",decoded)
        req.user = decoded;
        next();
    })
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

async function verifyExistingUser(req, res, next) {
    let { username } = req.body;
    username = username.trim();
    const user = await User.findOne({ username });
    if (user) { return res.status(409).json({ message: "User already exist" }); }
    next();
}

module.exports = { verifyToken, verifyBody, verifyExistingUser };