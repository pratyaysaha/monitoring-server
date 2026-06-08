const multer = require("multer");
const fs = require("fs");
const path = require("path");
const { randomUUID } = require("crypto");
const { blogAssetPath } = require("./index");

const ALLOWED_MIME_TYPES = new Set([
    "image/png",
    "image/jpeg",
    "image/webp",
    "image/gif",
]);

exports.storage = multer.diskStorage({
    destination(req, file, cb) {
        const { projectId } = req.params;
        const uploadDir = path.join(
            blogAssetPath,
            projectId,
        );
        fs.mkdirSync(uploadDir, { recursive: true });
        cb(null, uploadDir);
    },

    filename(req, file, cb) {
        const ext = path.extname(file.originalname);
        const assetId = randomUUID();
        file.assetId = assetId;
        cb(null, `${assetId}${ext}`);
    },
});

exports.fileFilter =  (req, file, cb)  => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
        return cb(
            new Error(
                `Unsupported file type: ${file.mimetype}`,
            ),
            false,
        );
    }

    cb(null, true);
};