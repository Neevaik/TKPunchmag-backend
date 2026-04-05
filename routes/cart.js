const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middlewares/verifications");
const {
    getCart,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart
} = require("../controllers/cartController");

router.get("/", verifyToken, getCart);
router.post("/add", verifyToken, addToCart);
router.put("/update/:productId", verifyToken, updateCartItem);
router.delete("/remove/:productId", verifyToken, removeFromCart);
router.delete("/clear", verifyToken, clearCart);

module.exports = router;