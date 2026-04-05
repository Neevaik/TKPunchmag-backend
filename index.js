const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");

require("dotenv").config();

const connectDB = require("./config/database");
const usersRoutes = require("./routes/auth");
const productRoutes = require("./routes/products");
const cartRoutes = require("./routes/cart");
const errorHandler = require("./middlewares/errorHandler");

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(cors());

app.use("/user", usersRoutes);
app.use("/product", productRoutes);
app.use("/cart", cartRoutes);
app.use(errorHandler);
connectDB();

app.listen(process.env.PORT || 3000, () => {
    console.log(`✅ Server on port : ${process.env.PORT}`);
});