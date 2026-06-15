const Order = require("../models/Order");
const stripe = require("../config/stripe");
const createAuditLog = require("../utils/createAuditLog");

async function createPaymentIntent(req, res, next) {
    try {
        console.log("🟡 [CREATE PAYMENT INTENT] START");
        console.log("📦 Body:", req.body);
        console.log("👤 User:", req.user?.id);

        const { orderId } = req.body;

        if (!orderId) {
            console.log("❌ Missing orderId");
            return res.status(400).json({
                ok: false,
                message: "❌ orderId is required"
            });
        }

        const order = await Order.findById(orderId);

        if (!order) {
            console.log("❌ Order not found:", orderId);
            return res.status(404).json({
                ok: false,
                message: "❌ Order not found"
            });
        }

        console.log("🧾 Order found:", {
            id: order._id,
            status: order.status,
            totalPrice: order.totalPrice,
            paymentIntentId: order.paymentIntentId
        });

        if (order.user.toString() !== req.user.id) {
            console.log("⛔ Forbidden user mismatch");
            return res.status(403).json({
                ok: false,
                message: "❌ Forbidden"
            });
        }

        if (order.status !== "pending") {
            console.log("⚠️ Order already processed:", order.status);
            return res.status(400).json({
                ok: false,
                message: `❌ Order is already ${order.status}`
            });
        }

        const amountInCents = Math.round(order.totalPrice * 100);

        console.log("💰 Amount in cents:", amountInCents);

        let paymentIntent;

        // 🔁 REUSE PAYMENT INTENT IF EXISTS
        if (order.paymentIntentId) {
            try {
                console.log("🔄 Retrieving existing PaymentIntent:", order.paymentIntentId);

                paymentIntent = await stripe.paymentIntents.retrieve(
                    order.paymentIntentId
                );

                console.log("📡 Stripe PaymentIntent status:", paymentIntent.status);

                // ❌ FIX ICI (ancien bug)
                if (paymentIntent.status === "succeeded") {
                    console.log("❌ Already succeeded");
                    return res.status(400).json({
                        ok: false,
                        message: "❌ Payment already completed"
                    });
                }
            } catch (err) {
                console.log("⚠️ Invalid PaymentIntent, recreating...");
                console.log(err.message);
                order.paymentIntentId = null;
            }
        }

        // 🆕 CREATE PAYMENT INTENT
        if (!paymentIntent || !paymentIntent.id) {
            console.log("🆕 Creating new PaymentIntent");

            paymentIntent = await stripe.paymentIntents.create({
                amount: amountInCents,
                currency: "eur",
                payment_method_types: ["card"],
                metadata: {
                    orderId: order._id.toString(),
                    userId: req.user.id
                }
            });

            console.log("✅ PaymentIntent created:", paymentIntent.id);
        }

        order.paymentIntentId = paymentIntent.id;

        console.log("💾 Saving order with paymentIntentId");

        await order.save();

        console.log("✅ Order saved");

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

        console.log("📜 Audit log created");

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

async function handleWebhook(req, res) {
    const sig = req.headers["stripe-signature"];

    let event;

    try {
        event = stripe.webhooks.constructEvent(
            req.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (error) {
        console.error("❌ Webhook signature invalid:", error.message);
        return res.status(400).json({
            ok: false,
            message: `Webhook error: ${error.message}`
        });
    }

    try {
        switch (event.type) {

            case "payment_intent.succeeded": {
                const paymentIntent = event.data.object;

                await updateOrderByPaymentIntent(
                    paymentIntent.id,
                    "paid",
                    "PAYMENT_SUCCEEDED",
                    null
                );

                break;
            }

            case "payment_intent.payment_failed": {
                const paymentIntent = event.data.object;

                await updateOrderByPaymentIntent(
                    paymentIntent.id,
                    "cancelled",
                    "PAYMENT_FAILED",
                    null
                );

                break;
            }

            default:
                console.log(`ℹ️ Unhandled event type: ${event.type}`);
        }

        return res.status(200).json({ received: true });

    } catch (error) {
        console.error("❌ Webhook handler error:", error.message);

        return res.status(500).json({
            ok: false,
            message: "Internal server error"
        });
    }
}

module.exports = { createPaymentIntent, handleWebhook, updateOrderByPaymentIntent };