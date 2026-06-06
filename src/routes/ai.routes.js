const express = require("express");
const aiService = require("../services/geminiai.service");

const router = express.Router();

router.post("/generate", async (req, res) => {
  const data = await aiService.getGeminiResponse(req.body.prompt);
  res.json(data);
});

module.exports = router;