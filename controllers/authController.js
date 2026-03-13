const User = require("../models/User");
const bcrypt = require("bcrypt");
const { generateToken } = require("../middlewares/generateToken");
const { verifyToken, verifyExistingUser } = require("../middlewares/verifications");

async function signup(req, res, next) {
    try {
        let { username, email, password } = req.body;

        username = username.trim();
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            username,
            email,
            password: hashedPassword,
        });

        const token = await generateToken(newUser);

        await newUser.save();

        res.cookie("token", token, {
            httpOnly: true,
            sameSite: "strict",
            maxAge: 5 * 60 * 1000,
        });

        res.status(201).json({
            ok: true,
            message: "✅ User created",
            token
        });

    } catch (error) {
        next(error);
    }
}

async function login(req, res, next) {
    try {
        const { username, password } = req.body;
        
        const user = await User.findOne({ username });
        if (!user) { return res.status(401).json("User not found"); }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) return res.status(401).json({
            ok: false,
            message: "❌ Invalid credentials"
        });

        const token = await generateToken(user);

        res.cookie("token", token, {
            httpOnly: true,
            sameSite: "strict",
            maxAge: 5 * 60 * 1000,
        });

        res.status(200).json({
            ok: true,
            message: "✅ User connected",
            token
        });

    } catch (error) {
        next(error);
    }
}

async function logout(req, res, next) {
    try {
        res.clearCookie("token", {
            httpOnly: true,
            sameSite: "strict",
        });

        return res.status(200).json({
            ok: true,
            message: "✅ Logout successful",
        });

    } catch (error) {
        next(error);
    }
}

async function updateUser(req, res, next) {
    try {
        const { username, email, password } = req.body;

        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({
                ok: false,
                message: "❌ User not found"
            });
        }

        const updateData = {};

        if (username) {
            const trimmedUsername = username.trim();

            const existingUser = await User.findOne({ username: trimmedUsername });

            if (existingUser && existingUser._id.toString() !== req.params.id) {
                return res.status(409).json({
                    ok: false,
                    message: "❌ Username already exists"
                });
            }

            updateData.username = trimmedUsername;
        }

        if (email) { updateData.email = email; }
        if (password) { updateData.password = await bcrypt.hash(password, 10); }

        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        );

        res.json({
            ok: true,
            message: "✅ User updated",
            updatedUser
        });

    } catch (error) {
        next(error);
    }
}

async function deleteUser(req, res) {
    try {
        const user = await User.findByIdAndDelete(req.params.id);

        if (!user) {
            return res.status(404).json({
                ok: false,
                message: "❌ User not found"
            });
        }
        res.json({
            ok: true,
            message: "✅ User deleted"
        })
    } catch (error) {
        next(error);
    }
}

module.exports = { signup, login, logout, updateUser, deleteUser };