const express = require("express");
const service = require("../services/metrics.service");

const router = express.Router();

router.get("/summary", async (req, res) => {
  const data = await service.getSummary();

  if (!data) {
    return res.status(503).json({ error: "Metrics unavailable" });
  }

  res.json(data);
});

router.get("/history", async (req, res) => {
  const range = req.query.range || "1h";

  const data = await service.getHistory(range);

  if (!data) {
    return res.status(503).json({ error: "History unavailable" });
  }

  res.json(data);
});

module.exports = router;