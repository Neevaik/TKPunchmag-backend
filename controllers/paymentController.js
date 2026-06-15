const Order = require("../models/Order");
const stripe = require("../config/stripe");
const createAuditLog = require("../utils/createAuditLog");

async function createPaymentIntent(req, res, next) {
    try {
        const { orderId } = req.body;

        if (!orderId) {
            return res.status(400).json({
                ok: false,
                message: "❌ orderId is required"
            });
        }

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({
                ok: false,
                message: "❌ Order not found"
            });
        }

        if (order.user.toString() !== req.user.id) {
            return res.status(403).json({
                ok: false,
                message: "❌ Forbidden"
            });
        }

        if (order.status !== "pending") {
            return res.status(400).json({
                ok: false,
                message: `❌ Order is already ${order.status}`
            });
        }

        const amountInCents = Math.round(order.totalPrice * 100);

        let paymentIntent;

        if (order.paymentIntentId) {
            try {
                paymentIntent = await stripe.paymentIntents.retrieve(
                    order.paymentIntentId
                );

                if (paymentIntent.status === "succeeded") {
                    return res.status(400).json({
                        ok: false,
                        message: "❌ Payment already completed"
                    });
                }
            } catch (err) {
                order.paymentIntentId = null;
            }
        }

        if (!paymentIntent || !paymentIntent.id) {
            paymentIntent = await stripe.paymentIntents.create({
                amount: amountInCents,
                currency: "eur",
                payment_method_types: ["card"],
                metadata: {
                    orderId: order._id.toString(),
                    userId: req.user.id
                }
            });
        }

        order.paymentIntentId = paymentIntent.id;

        await order.save();
        await createAuditLog({
            req,
            action: "PAYMENT_INTENT_CREATED",
            entityType: "Order",
            entityId: order._id,
            before: null,
            after: {
                paymentIntentId: paymentIntent.id,
                status: order.status
            }
        });

        return res.status(200).json({
            ok: true,
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id,
            paymentMethod: "card"
        });

    } catch (error) {
        console.error("🔥 STRIPE CREATE PAYMENT INTENT ERROR:");
        console.error(error);

        return res.status(500).json({
            ok: false,
            message: "❌ Internal server error",
            error: error.message
        });
    }
}

async function updateOrderByPaymentIntent(paymentIntentId, newStatus, action, req) {
    const order = await Order.findOne({ paymentIntentId });

    if (!order) {
        console.warn("⚠️ Order not found for paymentIntent:", paymentIntentId);
        return;
    }

    const previousStatus = order.status;

    if (previousStatus === newStatus) return;

    order.status = newStatus;
    await order.save();

    await createAuditLog({
        req: req || { user: "stripe-webhook" },
        action,
        entityType: "Order",
        entityId: order._id,
        before: { status: previousStatus },
        after: { status: newStatus }
    });
}

const handleWebhook = async (req, res) => {
    const sig = req.headers["stripe-signature"];

    let event;

    try {
        event = stripe.webhooks.constructEvent(
            req.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err) {
        console.log("❌ Webhook error:", err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === "payment_intent.succeeded") {
        const paymentIntent = event.data.object;

        const orderId = paymentIntent.metadata.orderId;

        await Order.findByIdAndUpdate(orderId, {
            status: "success"
        });
    }
    res.json({ received: true });
};

module.exports = handleWebhook;

module.exports = { createPaymentIntent, handleWebhook, updateOrderByPaymentIntent };