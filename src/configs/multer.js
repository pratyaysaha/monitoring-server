const multer = require("multer");
const path = require("path");
const fs = require("fs");

const { automationScriptBasePath } = require("../configs/index");
const { AUTOMATION_ALLOWED_EXTENTIONS } = require("../constants/automation");

const BASE_SCRIPT_PATH = path.join(
    automationScriptBasePath,
    "scripts"
);

const ensureDir = (dir) => {
    fs.mkdirSync(dir, {
        recursive: true
    });
};



const fileFilter = (req, file, cb) => {
    const ext = path
        .extname(file.originalname)
        .replace(".", "")
        .toLowerCase();
    if (
        !AUTOMATION_ALLOWED_EXTENTIONS.includes(ext)
    ) {
        return cb(
            new Error(
                `.${ext} files are not allowed`
            )
        );
    }
    cb(null, true);
};

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        try {
            const scriptName = req.body.name;
            if (!scriptName) {
                return cb(
                    new Error("Script name is required")
                );
            }
            if (!req.scriptMeta?.id) {
                return cb(
                    new Error("Script metadata missing")
                );
            }
            const ext = path
                .extname(file.originalname)
                .replace(".", "")
                .toLowerCase();

            if (
                !AUTOMATION_ALLOWED_EXTENTIONS.includes(ext)
            ) {
                return cb(
                    new Error(
                        `.${ext} extension not allowed`
                    )
                );
            }

            const targetDir = path.join(
                BASE_SCRIPT_PATH,
                ext,
                req.scriptMeta.id
            );

            ensureDir(targetDir);

            cb(null, targetDir);

        } catch (err) {

            cb(err);
        }
    },

    filename: (req, file, cb) => {
        try {
            const ext = path.extname(
                file.originalname
            );
            const safeName = file.originalname
                .trim()
                .replace(/\s+/g, "-")
                .replace(/[^a-zA-Z0-9-_]/g, "")
                .toLowerCase();
            const unique =
                Date.now() +
                "-" +
                Math.round(Math.random() * 1e9);
            const finalName =
                `${safeName}_${unique}${ext}`;

            cb(null, finalName);

        } catch (err) {

            cb(err);
        }
    }
});

const upload = multer({
    storage,
    fileFilter
});

module.exports = upload;