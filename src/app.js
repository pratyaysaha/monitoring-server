const express = require("express");
const config = require("./configs");
const cors = require("cors");

const PORT = config.port;

const dashboardRoutes = require("./routes/dashboard.routes");
const metricsRoutes = require("./routes/metrics.routes");
const servicesRoutes = require("./routes/services.routes");
const notificationRoutes = require("./routes/notification.route");
const { initializeDatabase } = require("./db/init");

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
    methods: ["GET"],
    credentials: false
  })
);
app.use(express.json());

initializeDatabase();

app.use("/api/dashboard", dashboardRoutes);
app.use("/api/metrics", metricsRoutes);
app.use("/api/services", servicesRoutes);
app.use("/api/notification", notificationRoutes)

app.get("/api/ping", (req, res) => {
  res.json({ status: "ok" });
});

module.exports = app;