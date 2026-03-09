import os from 'os';

const startTime = Date.now();

export function getProcessStats() {
  const mem = process.memoryUsage();
  return {
    uptime: Math.floor((Date.now() - startTime) / 1000),
    uptimeFormatted: formatUptime(Date.now() - startTime),
    memory: {
      heapUsed: formatBytes(mem.heapUsed),
      heapTotal: formatBytes(mem.heapTotal),
      rss: formatBytes(mem.rss),
      external: formatBytes(mem.external),
      arrayBuffers: formatBytes(mem.arrayBuffers || 0),
      heapUsedRaw: mem.heapUsed,
      heapTotalRaw: mem.heapTotal,
      rssRaw: mem.rss,
      externalRaw: mem.external,
    },
    system: {
      platform: process.platform,
      nodeVersion: process.version,
      cpus: os.cpus().length,
      totalMem: formatBytes(os.totalmem()),
      totalMemRaw: os.totalmem(),
      freeMem: formatBytes(os.freemem()),
      freeMemRaw: os.freemem(),
      loadAvg: os.loadavg().map(v => v.toFixed(2)),
    },
  };
}

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function formatUptime(ms) {
  const s = Math.floor(ms / 1000);
  const days = Math.floor(s / 86400);
  const hours = Math.floor((s % 86400) / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}
