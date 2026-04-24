const express = require("express");
const config = require("./configs");
const cors = require("cors");

const PORT = config.port;

const dashboardRoutes = require("./routes/dashboard.routes");
const metricsRoutes = require("./routes/metrics.routes");
const servicesRoutes = require("./routes/services.routes");

const app = express();

app.use(
  cors({
    origin: [
      `http://localhost:${PORT}`
    ],
    methods: ["GET"],
    credentials: false
  })
);
app.use(express.json());

app.use("/api/dashboard", dashboardRoutes);
app.use("/api/metrics", metricsRoutes);
app.use("/api/services", servicesRoutes);

app.get("/api/ping", (req, res) => {
  res.json({ status: "ok" });
});

module.exports = app;