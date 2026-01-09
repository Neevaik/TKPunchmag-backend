const express = require("express");
const User = require("../models/User");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { verifyBody, verifyExistingUser } = require("../middlewares/verifications");

router.post("/login", verifyBody(["username", "password"]), async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username: req.body.username });
        if (!user) { return res.status(401).json("User not found"); }

        const isPasswordValid = bcrypt.compare(password, user.password);
        if (!isPasswordValid) { return res.status(401).json({ message: "Unauthorized" }); }

        const token = jwt.sign(
            {
                id: user._id,
                username: username
            }, process.env.JWT_SECRET,
            { expiresIn: "1h" }
        )

        return res.status(200).json({ message: "✅User logged", user, token });

    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
})

router.post("/signup", verifyBody(["username", "password", "email"]), verifyExistingUser, async (req, res) => {
    try {
        const { username, password, email } = req.body;

        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const newUser = new User({
            username,
            password: hashedPassword,
            email
        });
        await newUser.save();

        res.status(201).json({ message: "✅User created", user: newUser });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
})

module.exports = router;