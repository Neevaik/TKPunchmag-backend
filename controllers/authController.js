const User = require("../models/User");
const bcrypt = require("bcrypt");
const { generateAccessToken, generateRefreshToken } = require("../middlewares/generateToken");
const { verifyRefreshToken } = require("../middlewares/verifications");

async function signup(req, res) {
    let { username, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    username = username.trim();
    const newUser = new User({
        username,
        email,
        password: hashedPassword,
    });
    const refreshToken = await generateRefreshToken(newUser);
    newUser.refreshToken = await generateRefreshToken(newUser);

    await newUser.save();
    const accessToken = await generateAccessToken(refreshToken);

    res.status(201).json({ message: "✅ User created", token: accessToken })
}

async function login(req, res) {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) { return res.status(401).json("User not found"); }

    const isPasswordValid = bcrypt.compare(password, user.password);
    if (!isPasswordValid) { return res.status(401).json({ message: "❌ Invalid credentials" }); }

    const refreshTokenVerified = await verifyRefreshToken(user);
    if (refreshTokenVerified.valid === false) {
        user.refreshToken = await generateRefreshToken(user);
    }

    const accessToken = await generateAccessToken(user.refreshToken);

    return res.status(200).json({
        message: "✅ User connected",
        accessToken
    });
}

async function logout(req, res) {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
        res.clearCookie("accessToken");
        return res.status(204).end();
    }

    const user = await User.findOne({ refreshToken });
    if (user) {
        user.refreshToken = null;
        await user.save();
    }

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    res.clearCookie("accessToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });
    
    return res.status(200).json({
        message: "✅ Logout successful",
    });
}

async function updateUser(req, res) {
    const { username, email, password } = req.body;
    const updateData = {};
    if (username) {
        updateData.username = username.trim();
        const existingUser = await User.findOne({ username: username.trim() })
        if (existingUser) { return res.status(409).json({ message: "❌ Username already exist" }); }
    }
    if (email) { updateData.email = email; }
    if (password) { updateData.password = await bcrypt.hash(password, 10); }

    await User.findByIdAndUpdate(
        req.params.id,
        updateData,
    );
    res.json({ message: "✅ User updated", updatedUser: updateData });
}

async function deleteUser(req, res) {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "✅ User deleted" })
}

module.exports = { signup, login, logout, updateUser, deleteUser };