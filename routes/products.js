const express = require("express");
const router = express.Router();
const { requireRole, verifyToken } = require("../middlewares/verifications");
const {
    createProduct,
    getProducts,
    searchProducts,
    getProductsByCategory,
    updateProduct,
    deleteProduct,
} = require("../controllers/productController");

router.post("/create", verifyToken, requireRole("admin"), createProduct);
router.get("/", getProducts);
router.get("/search", searchProducts);
router.get("/category/:category", getProductsByCategory);
router.put("/:id", verifyToken, requireRole("admin"), updateProduct);
router.delete("/:id", verifyToken, requireRole("admin"), deleteProduct);

module.exports = router;