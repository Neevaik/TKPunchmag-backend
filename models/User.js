const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        require,
        unique: true
    },
    email: {
        type: String,
        require
    },
    password: String,
    token: String,
},
    { timestamps: true }
)

const User = mongoose.model("User", userSchema);

module.exports = User;