const Order = require("../models/Order");
const stripe = require("../config/stripe");
const createAuditLog = require("../utils/createAuditLog");

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
        return res.status(400).json({ message: `Webhook error: ${error.message}` });
    }

    try {
        switch (event.type) {

            case "payment_intent.succeeded": {
                const paymentIntent = event.data.object;

                const order = await Order.findOneAndUpdate(
                    { paymentIntentId: paymentIntent.id },
                    { status: "paid" },
                    { new: true }
                );

                if (order) {
                    await createAuditLog({
                        req,
                        action: "PAYMENT_SUCCEEDED",
                        entityType: "Order",
                        entityId: order._id,
                        before: { status: "pending" },
                        after: { status: "paid" }
                    });
                }
                break;
            }

            case "payment_intent.payment_failed": {
                const paymentIntent = event.data.object;

                const order = await Order.findOneAndUpdate(
                    { paymentIntentId: paymentIntent.id },
                    { status: "cancelled" },
                    { new: true }
                );

                if (order) {
                    await createAuditLog({
                        req,
                        action: "PAYMENT_FAILED",
                        entityType: "Order",
                        entityId: order._id,
                        before: { status: "pending" },
                        after: { status: "cancelled" }
                    });
                }
                break;
            }

            default:
                console.log(`ℹ️ Unhandled event type: ${event.type}`);
        }

        return res.status(200).json({ received: true });

    } catch (error) {
        console.error("❌ Webhook handler error:", error.message);
        return res.status(500).json({ message: "Internal server error" });
    }
}

module.exports = { handleWebhook };