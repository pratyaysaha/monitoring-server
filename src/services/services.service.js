const axios = require("axios");
const config = require("../configs");

const TIMEOUT = 2000;

// optional: in-memory cache
let cache = null;
let lastUpdated = 0;
const CACHE_TTL = 5000; // 5 sec

async function checkService(service) {
  const start = Date.now();

  try {
    await axios.get(service.url, {
      timeout: TIMEOUT
    });

    return {
      name: service.name,
      url: service.url,
      status: "UP",
      latency: Date.now() - start
    };
  } catch (err) {
    return {
      name: service.name,
      url: service.url,
      status: "DOWN",
      latency: null
    };
  }
}

exports.getServices = async () => {
  const now = Date.now();

  // return cached if fresh
  if (cache && now - lastUpdated < CACHE_TTL) {
    return cache;
  }

  const results = await Promise.all(
    config.services.map((svc) => checkService(svc))
  );

  cache = results;
  lastUpdated = now;

  return results;
};