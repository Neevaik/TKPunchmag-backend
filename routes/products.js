const express = require("express");
const router = express.Router();
const {
    createProduct,
    getProducts,
    getProductBySlug,
    searchProducts,
    getProductsByCategory,
} = require("../controllers/productController");

router.post("/", createProduct);

router.get("/", getProducts);
router.get("/search", searchProducts );
router.get("/category/:category", getProductsByCategory );
router.get("/:slug", getProductBySlug);

module.exports = router;