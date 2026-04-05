const Order = require("../models/Order");
const Cart = require("../models/Cart");
const Product = require("../models/Product");
const createAuditLog = require("../utils/createAuditLog");

async function checkout(req, res, next) {
    try {
        const cart = await Cart.findOne({ user: req.user.id })
            .populate("items.product", "name price stock isActive");

        if (!cart || cart.items.length === 0) {
            return res.status(400).json({
                ok: false,
                message: "❌ Cart is empty"
            });
        }

        // Vérification stock pour chaque item
        for (const item of cart.items) {
            if (!item.product.isActive) {
                return res.status(400).json({
                    ok: false,
                    message: `❌ Product "${item.product.name}" is no longer available`
                });
            }

            if (item.product.stock < item.quantity) {
                return res.status(400).json({
                    ok: false,
                    message: `❌ Not enough stock for "${item.product.name}". Available: ${item.product.stock}`
                });
            }
        }

        // Snapshot des produits au moment de l'achat
        const products = cart.items.map(item => ({
            product: item.product._id,
            name: item.product.name,
            price: item.product.price,
            quantity: item.quantity
        }));

        const totalPrice = parseFloat(
            products.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2)
        );

        // Décrémentation du stock
        for (const item of cart.items) {
            await Product.findByIdAndUpdate(item.product._id, {
                $inc: { stock: -item.quantity }
            });
        }

        // Création de la commande
        const order = new Order({
            user: req.user.id,
            products,
            totalPrice,
            status: "pending"
        });

        await order.save();

        // Vider le cart
        cart.items = [];
        await cart.save();

        await createAuditLog({
            req,
            action: "ORDER_CREATED",
            entityType: "Order",
            entityId: order._id,
            before: null,
            after: order.toObject()
        });

        return res.status(201).json({
            ok: true,
            message: "✅ Order placed successfully",
            order
        });

    } catch (error) {
        next(error);
    }
}

async function getMyOrders(req, res, next) {
    try {
        const orders = await Order.find({ user: req.user.id })
            .sort({ createdAt: -1 });

        if (orders.length === 0) {
            return res.status(200).json({
                ok: true,
                message: "No orders found",
                orders: []
            });
        }

        return res.status(200).json({
            ok: true,
            count: orders.length,
            orders
        });

    } catch (error) {
        next(error);
    }
}

async function getOrderById(req, res, next) {
    try {
        const order = await Order.findById(req.params.id)
            .populate("user", "username email");

        if (!order) {
            return res.status(404).json({
                ok: false,
                message: "❌ Order not found"
            });
        }

        // Un customer ne peut voir que ses propres commandes
        if (
            order.user._id.toString() !== req.user.id &&
            req.user.role !== "admin" &&
            req.user.role !== "logistics"
        ) {
            return res.status(403).json({
                ok: false,
                message: "❌ Forbidden"
            });
        }

        return res.status(200).json({
            ok: true,
            order
        });

    } catch (error) {
        next(error);
    }
}

async function getAllOrders(req, res, next) {
    try {
        const { status } = req.query;

        const filter = status ? { status } : {};

        const orders = await Order.find(filter)
            .populate("user", "username email")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            ok: true,
            count: orders.length,
            orders
        });

    } catch (error) {
        next(error);
    }
}

async function updateOrderStatus(req, res, next) {
    try {
        const { status } = req.body;

        const validStatuses = ["pending", "paid", "shipped", "delivered"];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                ok: false,
                message: `❌ Invalid status. Valid values: ${validStatuses.join(", ")}`
            });
        }

        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({
                ok: false,
                message: "❌ Order not found"
            });
        }

        const before = order.toObject();

        order.status = status;
        await order.save();

        await createAuditLog({
            req,
            action: "ORDER_STATUS_UPDATED",
            entityType: "Order",
            entityId: order._id,
            before,
            after: order.toObject()
        });

        return res.status(200).json({
            ok: true,
            message: `✅ Order status updated to "${status}"`,
            order
        });

    } catch (error) {
        next(error);
    }
}

module.exports = {
    checkout,
    getMyOrders,
    getOrderById,
    getAllOrders,
    updateOrderStatus
};