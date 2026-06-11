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

        // Vérifier que la commande appartient bien à l'utilisateur connecté
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

        // Si un PaymentIntent existe déjà, on le réutilise
        if (order.paymentIntentId) {
            const existingIntent = await stripe.paymentIntents.retrieve(order.paymentIntentId);

            if (existingIntent.status === "requires_payment_method" || existingIntent.status === "requires_confirmation") {
                return res.status(200).json({
                    ok: true,
                    clientSecret: existingIntent.client_secret,
                    paymentIntentId: existingIntent.id
                });
            }
        }

        // Stripe attend le montant en centimes (entier)
        const amountInCents = Math.round(order.totalPrice * 100);

        const paymentIntent = await stripe.paymentIntents.create({
            amount: amountInCents,
            currency: "eur",
            metadata: {
                orderId: order._id.toString(),
                userId: req.user.id
            }
        });

        // Sauvegarder le paymentIntentId sur la commande
        order.paymentIntentId = paymentIntent.id;
        await order.save();

        await createAuditLog({
            req,
            action: "PAYMENT_INTENT_CREATED",
            entityType: "Order",
            entityId: order._id,
            before: null,
            after: { paymentIntentId: paymentIntent.id, status: order.status }
        });

        return res.status(201).json({
            ok: true,
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id
        });

    } catch (error) {
        next(error);
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
        req: req || { user: "stripe-webhook" }, // ⚠️ safe fallback
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
                    null // ⚠️ important: pas de req dans webhook
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

module.exports = { createPaymentIntent, handleWebhook };