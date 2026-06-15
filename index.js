throw new Error("TEST NORTHFLANK RUNNING FILE");

const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const connectDB = require("./config/database");
const errorHandler = require("./middlewares/errorHandler");

require("dotenv").config();

const usersRoutes = require("./routes/auth");
const productRoutes = require("./routes/products");
const cartRoutes = require("./routes/cart");
const orderRoutes = require("./routes/order");
const paymentRoutes = require("./routes/payment");

const app = express();

app.use("/payment/webhook", express.raw({ type: "application/json" }));

app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: process.env.CLIENT_URL,
    credentials: true
}));

app.use("/user", usersRoutes);
app.use("/product", productRoutes);
app.use("/cart", cartRoutes);
app.use("/order", orderRoutes);
app.use("/payment", paymentRoutes);

app.use(errorHandler);

app.get("/", (req, res) => {
    res.send("API running");
});

const startServer = async () => {
    try {
        console.log("🔥 BEFORE MONGO");

        await connectDB();

        console.log("🔥 AFTER MONGO");

        const PORT = process.env.PORT || 5000;

        app.listen(PORT, () => {
            console.log(`✅ Server running on port ${PORT}`);
        });

    } catch (error) {
        console.error("❌ FATAL ERROR:", error);
        process.exit(1);
    }
};

startServer();