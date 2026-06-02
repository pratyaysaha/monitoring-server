const express = require("express");
const multer = require("multer");
const config = require("./configs");
const cors = require("cors");

const PORT = config.port;

const dashboardRoutes = require("./routes/dashboard.routes");
const metricsRoutes = require("./routes/metrics.routes");
const servicesRoutes = require("./routes/services.routes");
const notificationRoutes = require("./routes/notification.route");
const automationRoutes = require("./routes/automation.routes");

const { initializeFolderStructureForAutomation } = require("./configs/automation-init");
const { initializeDatabase: initializePushNotificationDb } = require("./db/push-notification/init");
const { initializeDatabase: intializeAutomationDb } = require("./db/automation/init")

const app = express();

app.use(
  cors({
    origin: [
      `http://192.168.1.8:3000`,
      'http://localhost:3000',
      'https://dev.home-server-dashboard-2y3.pages.dev',
      'https://home-server-dashboard-2y3.pages.dev',
      'https://dashboard.pratyaysaha.in',
      'https://dashboard.chiragchaudhuri.in',
    ],
    methods: ["GET", "POST"],
    credentials: false
  })
);
app.use(express.json());

initializePushNotificationDb();
intializeAutomationDb();

initializeFolderStructureForAutomation();

app.use("/api/dashboard", dashboardRoutes);
app.use("/api/metrics", metricsRoutes);
app.use("/api/services", servicesRoutes);
app.use("/api/notification", notificationRoutes);
app.use("/api/automation", automationRoutes);

app.get("/api/ping", (req, res) => {
  res.json({ status: "ok" });
});

module.exports = app;