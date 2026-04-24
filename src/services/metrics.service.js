const axios = require("axios");
const config = require("../configs");

const PROM_URL = config.promUrl;

const RANGE_CONFIG = {
  "1h": { seconds: 3600, step: 15 },
  "6h": { seconds: 21600, step: 30 },
  "24h": { seconds: 86400, step: 120 }
};

const QUERIES = {
  cpu: '100 * (1 - avg(rate(node_cpu_seconds_total{mode="idle"}[1m])))',
  load: 'node_load1',

  ram_total: 'node_memory_MemTotal_bytes',
  ram_available: 'node_memory_MemAvailable_bytes',

  ssd_total: 'node_filesystem_size_bytes{mountpoint="/",fstype!="tmpfs"}',
  ssd_available: 'node_filesystem_avail_bytes{mountpoint="/",fstype!="tmpfs"}',

  zfs_total: 'zfs_pool_size_bytes{name="raid1pool"}',
  zfs_used: 'zfs_pool_allocated_bytes{name="raid1pool"}',

  temp: 'max(node_hwmon_temp_celsius)',

  uptime: 'node_time_seconds - node_boot_time_seconds'
};

const HISTORY_QUERIES = {
  cpu: '100 * (1 - avg(rate(node_cpu_seconds_total{mode="idle"}[1m])))',

  memory:
    '(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100',

  disk:
    '(1 - (node_filesystem_avail_bytes{mountpoint="/",fstype!="tmpfs"} / node_filesystem_size_bytes{mountpoint="/",fstype!="tmpfs"})) * 100',

  load: 'node_load1'
};

// ---- helper ----
async function runQuery(query) {
  try {
    const res = await axios.get(`${PROM_URL}/api/v1/query`, {
      params: { query },
      timeout: 2000
    });

    const value = res.data?.data?.result?.[0]?.value?.[1];
    return value ? parseFloat(value) : null;
  } catch (err) {
    return null;
  }
}

async function runRangeQuery(query, start, end, step) {
  try {
    const res = await axios.get(`${PROM_URL}/api/v1/query_range`, {
      params: { query, start, end, step },
      timeout: 3000
    });

    const values = res.data?.data?.result?.[0]?.values || [];

    return values.map(([ts, val]) => ({
      ts: Number(ts),
      value: parseFloat(val)
    }));
  } catch (err) {
    return [];
  }
}

function bytesToGB(bytes) {
  return bytes ? +(bytes / 1024 / 1024 / 1024).toFixed(1) : null;
}

// ---- main function ----
exports.getSummary = async () => {
  const [
    cpu,
    load,
    ramTotal,
    ramAvail,
    ssdTotal,
    ssdAvail,
    zfsTotal,
    zfsUsed,
    temp,
    uptime
  ] = await Promise.all([
    runQuery(QUERIES.cpu),
    runQuery(QUERIES.load),
    runQuery(QUERIES.ram_total),
    runQuery(QUERIES.ram_available),
    runQuery(QUERIES.ssd_total),
    runQuery(QUERIES.ssd_available),
    runQuery(QUERIES.zfs_total),
    runQuery(QUERIES.zfs_used),
    runQuery(QUERIES.temp),
    runQuery(QUERIES.uptime)
  ]);

  return {
    cpu: cpu ? +cpu.toFixed(1) : null,
    load: load ? +load.toFixed(2) : null,

    ram: {
      used_gb: bytesToGB(ramTotal - ramAvail),
      total_gb: bytesToGB(ramTotal)
    },

    ssd: {
      used_gb: bytesToGB(ssdTotal - ssdAvail),
      total_gb: bytesToGB(ssdTotal)
    },

    zfs: {
      used_gb: bytesToGB(zfsUsed),
      total_gb: bytesToGB(zfsTotal)
    },

    temp_c: temp ? +temp.toFixed(1) : null,
    uptime_sec: uptime ? Math.floor(uptime) : null
  };
};

exports.getHistory = async (range = "1h") => {
  const configRange = RANGE_CONFIG[range] || RANGE_CONFIG["1h"];

  const end = Math.floor(Date.now() / 1000);
  const start = end - configRange.seconds;
  const step = configRange.step;

  const [cpu, memory, disk, load] = await Promise.all([
    runRangeQuery(HISTORY_QUERIES.cpu, start, end, step),
    runRangeQuery(HISTORY_QUERIES.memory, start, end, step),
    runRangeQuery(HISTORY_QUERIES.disk, start, end, step),
    runRangeQuery(HISTORY_QUERIES.load, start, end, step)
  ]);

  return {
    cpu,
    memory,
    disk,
    load
  };
};