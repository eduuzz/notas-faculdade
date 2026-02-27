function timestamp() {
  return new Date().toISOString();
}

export const logger = {
  info(msg, data) {
    console.log(`[${timestamp()}] INFO: ${msg}`, data !== undefined ? data : '');
  },
  warn(msg, data) {
    console.warn(`[${timestamp()}] WARN: ${msg}`, data !== undefined ? data : '');
  },
  error(msg, data) {
    console.error(`[${timestamp()}] ERROR: ${msg}`, data !== undefined ? data : '');
  },
};
