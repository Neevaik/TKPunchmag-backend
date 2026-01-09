const express = require("express");
const cors = require("cors");

require("dotenv").config();

const connectDB = require("./config/database");
const usersRoutes = require("./routes/auth");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/user", usersRoutes);

connectDB();

app.listen(process.env.PORT || 3000, () => {
    console.log(`✅ Server on port : ${process.env.PORT}`);
});