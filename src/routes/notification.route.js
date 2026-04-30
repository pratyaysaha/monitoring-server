const express = require("express");
const notificationService = require("../services/notification.service");

const router = express.Router();

router.post("/subscribe", async (req, res) => {
    try {
        const subscription = req.body;
        const result = notificationService.subscribePushNotification(subscription);
        res.json(result);
    } catch (ex) {
        console.error(ex);
        res.status(500).json({
            success: false,
            message: ex.message
        });
    }
});

router.get("/subscriptions", async (req, res) => {
    try {
        const subscriptions = notificationService.getAllSubscriptions();
        res.json(subscriptions);
    } catch (ex) {
        console.error(ex);
        res.status(500).json({
            success: false,
            message: ex.message
        });
    }
});

router.post("/test", async (req, res) => {
    try {
        const result = await notificationService.sendTestNotification(req.body);
        res.json(result);
    } catch (ex) {
        console.error(ex);
        res.status(500).json({
            success: false,
            message: ex.message
        });
    }
});

module.exports = router;
