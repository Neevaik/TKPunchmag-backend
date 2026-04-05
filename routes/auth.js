const express = require("express");
const router = express.Router();

const { verifyBody, verifyToken, requireRole, verifyExistingUser } = require("../middlewares/verifications");
const { signup, login, logout, getToken, updateUser, deleteUser } = require("../controllers/authController");

router.post("/login", verifyBody(["username", "password"]), login)
router.post("/signup", verifyBody(["username", "password", "email"]), verifyExistingUser, signup)
router.post("/logout", logout)

router.get("/token", getToken);

router.put("/:id", verifyToken, requireRole("admin"), updateUser);
router.delete("/:id", verifyToken, requireRole("admin"), deleteUser);

module.exports = router;