const express = require("express");
const User = require("../models/User");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { verifyBody, verifyExistingUser } = require("../middlewares/verifications");
const { signup, login } = require("../controllers/authController");

router.post("/login", verifyBody(["username", "password"]), login)

router.post("/signup", verifyBody(["username", "password", "email"]), verifyExistingUser, signup)

module.exports = router;