const Cart = require("../models/Cart");
const Product = require("../models/Product");

async function getCart(req, res, next) {
    try {
        const cart = await Cart.findOne({ user: req.user.id })
            .populate("items.product", "name price stock images isActive");

        if (!cart || cart.items.length === 0) {
            return res.status(200).json({
                ok: true,
                message: "Cart is empty",
                items: [],
                total: 0
            });
        }

        const total = cart.items.reduce((sum, item) => {
            return sum + item.product.price * item.quantity;
        }, 0);

        return res.status(200).json({
            ok: true,
            count: cart.items.length,
            total: parseFloat(total.toFixed(2)),
            items: cart.items
        });

    } catch (error) {
        next(error);
    }
}

async function addToCart(req, res, next) {
    try {
        const { productId, quantity = 1 } = req.body;

        if (!productId) {
            return res.status(400).json({
                ok: false,
                message: "❌ productId is required"
            });
        }

        if (quantity < 1) {
            return res.status(400).json({
                ok: false,
                message: "❌ Quantity must be at least 1"
            });
        }

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({
                ok: false,
                message: "❌ Product not found"
            });
        }

        if (!product.isActive) {
            return res.status(400).json({
                ok: false,
                message: "❌ Product is not available"
            });
        }

        if (product.stock < quantity) {
            return res.status(400).json({
                ok: false,
                message: `❌ Not enough stock. Available: ${product.stock}`
            });
        }

        let cart = await Cart.findOne({ user: req.user.id });

        if (!cart) {
            cart = new Cart({ user: req.user.id, items: [] });
        }

        const existingItem = cart.items.find(
            item => item.product.toString() === productId
        );

        if (existingItem) {
            const newQuantity = existingItem.quantity + quantity;

            if (newQuantity > product.stock) {
                return res.status(400).json({
                    ok: false,
                    message: `❌ Not enough stock. Available: ${product.stock}, already in cart: ${existingItem.quantity}`
                });
            }

            existingItem.quantity = newQuantity;
        } else {
            cart.items.push({ product: productId, quantity });
        }

        await cart.save();

        return res.status(200).json({
            ok: true,
            message: "✅ Product added to cart",
            cart
        });

    } catch (error) {
        next(error);
    }
}

async function updateCartItem(req, res, next) {
    try {
        const { productId } = req.params;
        const { quantity } = req.body;

        if (!quantity || quantity < 1) {
            return res.status(400).json({
                ok: false,
                message: "❌ Quantity must be at least 1"
            });
        }

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({
                ok: false,
                message: "❌ Product not found"
            });
        }

        if (quantity > product.stock) {
            return res.status(400).json({
                ok: false,
                message: `❌ Not enough stock. Available: ${product.stock}`
            });
        }

        const cart = await Cart.findOne({ user: req.user.id });
        if (!cart) {
            return res.status(404).json({
                ok: false,
                message: "❌ Cart not found"
            });
        }

        const item = cart.items.find(
            item => item.product.toString() === productId
        );

        if (!item) {
            return res.status(404).json({
                ok: false,
                message: "❌ Product not found in cart"
            });
        }

        item.quantity = quantity;
        await cart.save();

        return res.status(200).json({
            ok: true,
            message: "✅ Cart updated",
            cart
        });

    } catch (error) {
        next(error);
    }
}

async function removeFromCart(req, res, next) {
    try {
        const { productId } = req.params;

        const cart = await Cart.findOne({ user: req.user.id });
        if (!cart) {
            return res.status(404).json({
                ok: false,
                message: "❌ Cart not found"
            });
        }

        const itemExists = cart.items.find(
            item => item.product.toString() === productId
        );

        if (!itemExists) {
            return res.status(404).json({
                ok: false,
                message: "❌ Product not found in cart"
            });
        }

        cart.items = cart.items.filter(
            item => item.product.toString() !== productId
        );

        await cart.save();

        return res.status(200).json({
            ok: true,
            message: "🗑️ Product removed from cart",
            cart
        });

    } catch (error) {
        next(error);
    }
}

async function clearCart(req, res, next) {
    try {
        const cart = await Cart.findOne({ user: req.user.id });

        if (!cart || cart.items.length === 0) {
            return res.status(400).json({
                ok: false,
                message: "❌ Cart is already empty"
            });
        }

        cart.items = [];
        await cart.save();

        return res.status(200).json({
            ok: true,
            message: "🗑️ Cart cleared"
        });

    } catch (error) {
        next(error);
    }
}

module.exports = {
    getCart,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart
};