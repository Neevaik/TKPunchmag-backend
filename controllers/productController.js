const Product = require("../models/Product");
const slugify = require("../utils/slugify");

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

async function getProductBySlug(req, res, next) {
    try {

        const { slug } = req.params;

        const product = await Product.findOne({ slug });

        if (!product) {
            return res.status(404).json({
                ok: false,
                message: "❌ Product not found"
            });
        }

        return res.status(200).json({
            ok: true,
            product
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
            res.status(400).json({
                ok: false,
                message: "product not found",
            });
        }

        res.status(200).json({
            ok: true,
            count: products.length,
            products
        });

    } catch (error) {
        next(error);
    }
}

module.exports = {
    createProduct,
    getProducts,
    getProductBySlug,
    searchProducts,
};