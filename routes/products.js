const express = require("express");
const router = express.Router();
const { requireRole, verifyToken } = require("../middlewares/verifications");
const {
    createProduct,
    getProducts,
    updateProduct,
    deleteProduct,
    getTopRatedProducts,
} = require("../controllers/productController");

router.post("/create", verifyToken, requireRole("admin"), createProduct);
router.get("/", getProducts);
router.get("/top-rated", getTopRatedProducts);
router.put("/:id", verifyToken, requireRole("admin"), updateProduct);
router.delete("/:id", verifyToken, requireRole("admin"), deleteProduct);

module.exports = router;