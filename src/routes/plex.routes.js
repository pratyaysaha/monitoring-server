const express = require("express");
const plexService = require("../services/plex.service");

const router = express.Router();

router.get("/refresh-all", async (req, res) => {
    try {
        const result = await plexService.refreshAll();
        res.status(result.status).json(result);
    } catch (ex) {
        console.error(ex);
        res.status(500).json({
            success: false,
            message: ex.message
        });
    }
});

module.exports = router;