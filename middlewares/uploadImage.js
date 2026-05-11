const multer = require("multer");

const storage = multer.diskStorage({
    destination: "tmp/",
    filename: (req, file, cb) => {
        cb(null, Date.now() + "-" + file.originalname);
    },
});

module.exports = multer({ storage });