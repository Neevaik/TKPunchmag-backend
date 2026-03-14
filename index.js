const express = require("express");
const cors = require("cors");

require("dotenv").config();

const connectDB = require("./config/database");
const usersRoutes = require("./routes/auth");
const productRoutes = require("./routes/products");
const errorHandler = require("./middlewares/errorHandler");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/user", usersRoutes);
app.use("/product", productRoutes);
app.use(errorHandler);
connectDB();

app.listen(process.env.PORT || 3000, () => {
    console.log(`✅ Server on port : ${process.env.PORT}`);
});