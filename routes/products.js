const express = require("express");
const router = express.Router();
const {
    createProduct,
    getProducts,
    searchProducts,
    getProductsByCategory,
    updateProduct,
    deleteProduct,
} = require("../controllers/productController");

router.post("/create", createProduct);
router.get("/", getProducts);
router.get("/search", searchProducts);
router.get("/category/:category", getProductsByCategory);
router.put("/:id", updateProduct);
router.delete("/:id", deleteProduct);

module.exports = router;