const express = require("express");
const config = require("./configs");
const cors = require("cors");

const PORT = config.port;

const dashboardRoutes = require("./routes/dashboard.routes");
const metricsRoutes = require("./routes/metrics.routes");
const servicesRoutes = require("./routes/services.routes");
const notificationRoutes = require("./routes/notification.route");
const plexRoutes = require("./routes/plex.routes");
const aiRoutes = require("./routes/ai.routes");
const blogRoutes = require("./routes/blog.routes");

const { initializeDatabase } = require("./db/init");
const { initializeBlogDatabase } = require("./db/blog-db-init");

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
initializeBlogDatabase();

app.use("/api/dashboard", dashboardRoutes);
app.use("/api/metrics", metricsRoutes);
app.use("/api/services", servicesRoutes);
app.use("/api/notification", notificationRoutes)
app.use("/api/plex", plexRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/blog", blogRoutes);

app.get("/api/ping", (req, res) => {
  res.json({ status: "ok" });
});

module.exports = app;