const Product = require("../models/Product");
const slugify = require("../utils/slugify");
const createAuditLog = require("../utils/createAuditLog");

async function createProduct(req, res, next) {
    try {
        const {
            name,
            description,
            category,
            brand,
            price,
            stock,
            images,
            attributes
        } = req.body;

        const slug = slugify(name);

        const newProduct = new Product({
            name,
            slug,
            description,
            category,
            brand,
            price,
            stock,
            images,
            attributes
        });

        await newProduct.save();

        return res.status(201).json({
            ok: true,
            message: "✅ Product created",
            product: newProduct
        });

    } catch (error) {
        next(error);
    }
}

async function getProducts(req, res, next) {
    try {

        const products = await Product.find();

        return res.status(200).json({
            ok: true,
            count: products.length,
            products
        });

    } catch (error) {
        next(error);
    }
}

async function getProductsByCategory(req, res, next) {
    try {

        const { category } = req.params;
        const products = await Product.find({
            category: { $regex: category, $options: "i" }
        });

        if (products.length === 0) {
            return res.status(404).json({
                ok: false,
                message: "No products found for this category"
            });
        }

        return res.status(200).json({
            ok: true,
            category,
            count: products.length,
            products
        });

    } catch (error) {
        next(error);
    }
}

async function searchProducts(req, res, next) {
    try {
        const { q } = req.query;

        if (!q) {
            return res.status(400).json({
                ok: false,
                message: "Search query is required"
            });
        }

        const products = await Product.find({
            $or: [
                { name: { $regex: q, $options: "i" } },
                { category: { $regex: q, $options: "i" } },
                { brand: { $regex: q, $options: "i" } },
                { description: { $regex: q, $options: "i" } }
            ]
        });

        if (products.length === 0) {
            return res.status(404).json({
                ok: false,
                message: "No products found"
            });
        }

        return res.status(200).json({
            ok: true,
            count: products.length,
            products
        });

    } catch (error) {
        next(error);
    }
}

async function updateProduct(req, res, next) {
    try {
        const productId = req.params.id;

        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({
                ok: false,
                message: "❌ Product not found"
            });
        }

        const before = product.toObject();

        const {
            name,
            description,
            category,
            brand,
            price,
            stock,
            images,
            attributes,
            isActive
        } = req.body;

        const updateData = {};

        if (name) {
            const trimmedName = name.trim();
            updateData.name = trimmedName;
            updateData.slug = trimmedName.toLowerCase().replace(/\s+/g, "-");
        }

        if (description !== undefined) updateData.description = description;
        if (category) updateData.category = category;
        if (brand !== undefined) updateData.brand = brand;

        if (price !== undefined) {
            if (price < 0) {
                return res.status(400).json({
                    ok: false,
                    message: "❌ Price cannot be negative"
                });
            }
            updateData.price = price;
        }

        if (stock !== undefined) {
            if (stock < 0) {
                return res.status(400).json({
                    ok: false,
                    message: "❌ Stock cannot be negative"
                });
            }
            updateData.stock = stock;
        }

        if (images) updateData.images = images;
        if (attributes) updateData.attributes = attributes;
        if (isActive !== undefined) updateData.isActive = isActive;

        const updatedProduct = await Product.findByIdAndUpdate(
            productId,
            updateData,
            { new: true }
        );

        await createAuditLog({
            req,
            action: "UPDATE_PRODUCT",
            entityType: "Product",
            entityId: productId,
            before,
            after: updatedProduct.toObject()
        });

        res.status(200).json({
            ok: true,
            message: "✅ Product updated",
            product: updatedProduct
        });

    } catch (error) {
        next(error);
    }
}

async function deleteProduct(req, res, next) {
    try {
        const productId = req.params.id;

        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({
                ok: false,
                message: "❌ Product not found"
            });
        }

        const before = product.toObject();

        await Product.findByIdAndDelete(productId);

        await createAuditLog({
            req,
            action: "DELETE_PRODUCT",
            entityType: "Product",
            entityId: productId,
            before,
            after: null
        });

        res.status(200).json({
            ok: true,
            message: "🗑️ Product deleted"
        });

    } catch (error) {
        next(error);
    }
}

module.exports = {
    createProduct,
    getProducts,
    searchProducts,
    getProductsByCategory,
    updateProduct,
    deleteProduct
};