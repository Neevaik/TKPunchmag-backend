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

/* =========================
   WEBHOOK STRIPE (IMPORTANT)
========================= */
app.use("/payment/webhook", express.raw({ type: "application/json" }));

/* =========================
   MIDDLEWARES
========================= */
app.use(express.json());
app.use(cookieParser());

app.use(cors({
    origin: process.env.CLIENT_URL,
    credentials: true
}));

/* =========================
   ROUTES
========================= */
app.use("/user", usersRoutes);
app.use("/product", productRoutes);
app.use("/cart", cartRoutes);
app.use("/order", orderRoutes);
app.use("/payment", paymentRoutes);

/* =========================
   HEALTH CHECK
========================= */
app.get("/", (req, res) => {
    res.send("API running");
});

app.get("/health", (req, res) => {
    res.json({
        ok: true,
        message: "Backend is alive"
    });
});

/* =========================
   ERROR HANDLER
========================= */
app.use(errorHandler);

/* =========================
   START SERVER (IMPORTANT)
========================= */
const startServer = async () => {
    try {
        console.log("🔥 STARTING BACKEND...");

        console.log("🔥 CONNECTING TO DATABASE...");
        await connectDB();

        const PORT = process.env.PORT;

        console.log("🔥 NORTHFLANK PORT:", PORT);

        if (!PORT) {
            throw new Error("❌ PORT not provided by Northflank");
        }

        app.listen(PORT, "0.0.0.0", () => {
            console.log(`✅ Server running on port ${PORT}`);
        });

    } catch (error) {
        console.error("❌ FATAL ERROR:", error);
        process.exit(1);
    }
};

startServer();