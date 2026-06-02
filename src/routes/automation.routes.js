const express = require("express");
const { attachScriptMeta } = require("../middleware/attach-script-meta");
const { createScript, getAllScripts } = require("../services/automation.service")

const upload = require("../configs/multer");

const router = express.Router();

router.post("/script", attachScriptMeta, upload.any(), async (req, res) => {
    try {
        const requestBody = {
            ...req.body,
            ref_id: req.scriptMeta.id,
            metadata: {
                ...JSON.parse(req.body.metadata),
                scripts: req.files
            }
        }
        const output = createScript(requestBody)
        res.json({
            success: true,
            data: output
        })
    } catch (ex) {
        console.log(ex)
        res.status(500).json({
            success: false,
            message: ex.message
        })
    }
})

router.get("/script", async (req, res) => {
    try {
        const result = await getAllScripts();
        res.json({
            success: true,
            data: result
        })
    } catch (ex) {
        console.log("Error", ex)
        res.status(500).json({
            success: false,
            message: ex.message
        })
    }
})

module.exports = router;