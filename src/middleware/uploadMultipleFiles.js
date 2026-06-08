const multer = require("multer");
const { storage, fileFilter } = require("../configs/multer.config");

const upload = multer({
    storage,
    fileFilter,
    limits: {
        files: 10,
        fileSize: 10 * 1024 * 1024
    }
});

module.exports = {
    uploadSingleImage: upload.single("file"),

    uploadMultipleImages: upload.array(
        "files",
        10
    ),

    uploadAnyAsset: upload.any()
};