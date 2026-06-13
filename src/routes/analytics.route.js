const express = require("express");
const { umamiClient } = require("../client/umami.client");
const { getBlogAnalyticsStats, getBlogAnalyticsPageView, getBlogAnalyticsMetrics } = require("../services/analytics.service");


const router = express.Router();

router.get("/blog/project/:projectId/stats", async (req, res) => {
    getBlogAnalyticsStats(req.params.projectId, req.query, res);
});

router.get("/blog/project/:projectId/page-views", async (req, res) => {
    getBlogAnalyticsPageView(req.params.projectId, req.query, res);
});
router.get("/blog/project/:projectId/metrics", async(req, res) => {
    getBlogAnalyticsMetrics(req.params.projectId, req.query, res)
})
module.exports = router;