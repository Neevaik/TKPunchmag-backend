const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

async function signup(req, res) {
    let { username, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    username = username.trim();
    const newUser = new User({
        username,
        email,
        password: hashedPassword
    });

    await newUser.save();

    res.status(201).json({ message: "✅ User created", newUser })
}

async function login(req, res) {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) { return res.status(401).json("User not found"); }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) { return res.status(401).json({ message: "❌ Invalid credentials" }); }

    const token = jwt.sign(
        {
            id: user._id,
            username: user.username
        },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
    );
    return res.status(200).json({
        message: "✅",
        user,
        token
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

module.exports = { signup, login, updateUser, deleteUser };