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

        await createAuditLog({
            req,
            action: "CREATE_PRODUCT",
            entityType: "Product",
            entityId: newProduct._id,
            before: null,
            after: newProduct.toObject()
        });

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
        const {
            page = 1,
            limit = 12,
            category,
            brand,
            search,
            sort = "newest",
            minPrice,
            maxPrice,
        } = req.query;

        const pageNum = Math.max(1, parseInt(page) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 12));
        const skip = (pageNum - 1) * limitNum;
        const filter = { isActive: true };

        if (category) {
            filter.category = { $regex: category, $options: "i" };
        }

        if (brand) {
            filter.brand = { $regex: brand, $options: "i" };
        }

        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: "i" } },
                { description: { $regex: search, $options: "i" } },
                { brand: { $regex: search, $options: "i" } },
            ];
        }

        if (minPrice !== undefined || maxPrice !== undefined) {
            filter.price = {};
            if (minPrice !== undefined) filter.price.$gte = parseFloat(minPrice);
            if (maxPrice !== undefined) filter.price.$lte = parseFloat(maxPrice);
        }

        const sortMap = {
            newest: { createdAt: -1 },
            oldest: { createdAt: 1 },
            price_asc: { price: 1 },
            price_desc: { price: -1 },
            name_asc: { name: 1 },
            name_desc: { name: -1 },
        };
        const sortQuery = sortMap[sort] ?? sortMap.newest;

        const [products, total] = await Promise.all([
            Product.find(filter).sort(sortQuery).skip(skip).limit(limitNum),
            Product.countDocuments(filter),
        ]);

        const totalPages = Math.ceil(total / limitNum);

        return res.status(200).json({
            ok: true,
            pagination: {
                total,
                page: pageNum,
                limit: limitNum,
                totalPages,
                hasNext: pageNum < totalPages,
                hasPrev: pageNum > 1,
            },
            products,
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
            message: "Product deleted"
        });

    } catch (error) {
        next(error);
    }
}

module.exports = {
    createProduct,
    getProducts,
    updateProduct,
    deleteProduct
};