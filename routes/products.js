const express = require("express");
const router = express.Router();
const upload = require("../middlewares/uploadImage");
const cloudinary = require("../config/cloudinary");
const fs = require("fs");
const { requireRole, verifyToken } = require("../middlewares/verifications");
const {
    createProduct,
    getProducts,
    updateProduct,
    deleteProduct,
    getTopRatedProducts,
    uploadImage,
} = require("../controllers/productController");

router.get("/", getProducts);
router.get("/top-rated", getTopRatedProducts);

router.post("/create", verifyToken, requireRole("admin"), createProduct);
router.post("/upload-pictures", verifyToken, requireRole("admin"), upload.single("file"), uploadImage);

router.put("/:id", verifyToken, requireRole("admin"), updateProduct);

router.delete("/:id", verifyToken, requireRole("admin"), deleteProduct);

module.exports = router;