const express = require("express");
const service = require("../services/dashboard.service");

const router = express.Router();

router.get("/", async (req, res) => {
  const data = await service.getDashboard();
  res.json(data);
});

module.exports = router;