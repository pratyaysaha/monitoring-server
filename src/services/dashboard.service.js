const metricsService = require("./metrics.service");
const servicesService = require("./services.service");

exports.getDashboard = async () => {
  const [metrics, services] = await Promise.all([
    metricsService.getSummary(),
    servicesService.getServices()
  ]);

  return {
    status: {
      server: metrics ? "online" : "offline"
    },
    metrics,
    services,
    timestamp: new Date().toISOString()
  };
};