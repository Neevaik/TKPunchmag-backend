const Order = require("../models/Order");
const stripe = require("../config/stripe");
const createAuditLog = require("../utils/createAuditLog");

async function updateOrderStatus(paymentIntentId, newStatus, action, req) {
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
    req,
    action,
    entityType: "Order",
    entityId: order._id,
    before: { status: previousStatus },
    after: { status: newStatus },
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
    return res.status(400).json({ message: `Webhook error: ${error.message}` });
  }

  try {
    switch (event.type) {

      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object;

        await updateOrderStatus(
          paymentIntent.id,
          "paid",
          "PAYMENT_SUCCEEDED",
          req
        );
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object;

        await updateOrderStatus(
          paymentIntent.id,
          "cancelled",
          "PAYMENT_FAILED",
          req
        );
        break;
      }

      case "checkout.session.completed": {
        const session = event.data.object;

        await updateOrderStatus(
          session.payment_intent,
          "paid",
          "CHECKOUT_COMPLETED",
          req
        );
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