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
    origin: (origin, callback) => {
      const allowed = [
        /^https:\/\/.*\.pages\.dev$/,
        /^https:\/\/dashboard\.pratyaysaha\.in$/,
        /^https:\/\/dashboard\.chiragchaudhuri\.in$/,
        /^http:\/\/localhost:3000$/,
        /^http:\/\/192\.168\.1\.8:3000$/,
      ];

      if (!origin || allowed.some((r) => r.test(origin))) {
        return callback(null, true);
      }

      callback(new Error("Not allowed by CORS"));
    },
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