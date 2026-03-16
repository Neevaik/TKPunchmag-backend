const User = require("../models/User");
const bcrypt = require("bcrypt");
const { generateToken } = require("../middlewares/generateToken");

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
            id: newUser._id,
            token
        });

    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                ok: false,
                message: "❌ Username ou email déjà utilisé"
            });
        }
        next(error);
    }
}

async function login(req, res, next) {
    try {
        const { username, password } = req.body;

        const user = await User.findOne({ username });
        if (!user) {
            return res.status(401).json({
                ok: false,
                message: "User not found"
            });
        }

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
            id: user._id,
            token,
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
        const userId = req.params.id;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                ok: false,
                message: "❌ User not found"
            });
        }

        const updateData = {};

        if (username) {
            const trimmedUsername = username.trim();

            const existingUsername = await User.findOne({ username: trimmedUsername });
            if (existingUsername && existingUsername._id.toString() === userId) {
                return res.status(409).json({
                    ok: false,
                    message: "❌ Username already used"
                });
            }

            updateData.username = trimmedUsername;
        }

        if (email) {
            const existingEmail = await User.findOne({ email });
            if (existingEmail && existingEmail._id.toString() !== userId) {
                return res.status(409).json({
                    ok: false,
                    message: "❌ Email already used"
                });
            }
            updateData.email = email;
        }

        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            updateData.password = hashedPassword;
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            updateData,
            { new: true }
        );

        res.status(200).json({
            ok: true,
            message: "✅ User updated",
            user: {
                id: updatedUser._id,
                username: updatedUser.username,
                email: updatedUser.email
            }
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