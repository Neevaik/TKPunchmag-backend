const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middlewares/verifications");
const { createPaymentIntent, handleWebhook } = require("../controllers/paymentController");

router.post("/webhook", handleWebhook);
router.post("/create-intent", verifyToken, createPaymentIntent);

module.exports = router;