const express = require("express");
const router = express.Router();

const { verifyBody } = require("../middlewares/verifications");
const { signup, login, logout, updateUser, deleteUser } = require("../controllers/authController");

router.post("/login", verifyBody(["username", "password"]), login)

router.post("/signup", verifyBody(["username", "password", "email"]), signup)

router.post("/logout", logout)

router.put("/:id", updateUser);

router.delete("/:id", deleteUser);

module.exports = router;