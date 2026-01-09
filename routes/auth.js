const express = require("express");
const router = express.Router();

const { verifyBody, verifyExistingUser, verifyAccessToken } = require("../middlewares/verifications");
const { signup, login, logout, updateUser, deleteUser } = require("../controllers/authController");

router.post("/login", verifyBody(["username", "password"]), login)

router.post("/logout", verifyBody(["username", "password"]), logout)

router.post("/signup", verifyBody(["username", "password", "email"]), verifyExistingUser, signup)

router.put("/:id", verifyAccessToken, updateUser);

router.delete("/:id", verifyAccessToken, deleteUser);

module.exports = router;