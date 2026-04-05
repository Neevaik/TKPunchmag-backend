const express = require("express");
const router = express.Router();
const { verifyToken, requireRole } = require("../middlewares/verifications");
const {
    checkout,
    getMyOrders,
    getOrderById,
    getAllOrders,
    updateOrderStatus
} = require("../controllers/orderController");

router.post("/checkout", verifyToken, checkout);
router.get("/my-orders", verifyToken, getMyOrders);
router.get("/all", verifyToken, requireRole("admin", "logistics"), getAllOrders);
router.get("/:id", verifyToken, getOrderById);
router.put("/:id/status", verifyToken, requireRole("admin", "logistics"), updateOrderStatus);

module.exports = router;