const express = require("express");
const router = express.Router();

const { verifyBody, verifyExistingUser, verifyToken } = require("../middlewares/verifications");
const { signup, login, updateUser, deleteUser } = require("../controllers/authController");

router.post("/login", verifyBody(["username", "password"]), login)

router.post("/signup", verifyBody(["username", "password", "email"]), verifyExistingUser, signup)

router.put("/:id", verifyToken, updateUser);

router.delete("/:id", verifyToken, deleteUser);

module.exports = router;