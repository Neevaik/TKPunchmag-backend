const Product = require("../models/Product");

async function createProduct(req, res, next) {
    try {
        const { name, description, category, brand, price, stock, images } = req.body;

        const slug = name.toLowerCase().replace(/ /g, "-");

        const newProduct = new Product({
            name,
            slug,
            description,
            category,
            brand,
            price,
            stock,
            images,
            attributes: {}
        });

        await newProduct.save();

        res.status(201).json({
            ok: true,
            message: "✅ Product created",
            product: newProduct
        });

    } catch (error) {
        next(error);
    }
}

module.exports = { createProduct };