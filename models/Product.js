const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    slug: {
        type: String,
        unique: true
    },
    description: String,
    category: String,
    brand: String,
    price: Number,
    stock: {
        type: Number,
        default: 0
    },
    images: [String],
    attributes: {
        type: Map,
        of: mongoose.Schema.Types.Mixed
    }

}, { timestamps: true });

module.exports = mongoose.model("Product", productSchema);