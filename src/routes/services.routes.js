const express = require("express");
const service = require("../services/services.service");

const router = express.Router();

router.get("/", async (req, res) => {
  const data = await service.getServices();

  res.json({
    services: data,
    timestamp: new Date().toISOString()
  });
});

module.exports = router;