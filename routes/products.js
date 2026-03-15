const express = require("express");
const router = express.Router();
const {
    createProduct,
    getProducts,
    getProductBySlug,
    searchProducts,
} = require("../controllers/productController");

router.post("/", createProduct);

router.get("/", getProducts);
router.get("/search", searchProducts );
router.get("/:slug", getProductBySlug);

module.exports = router;