/* eslint-disable @typescript-eslint/no-require-imports */
// Workaround for restricted Linux sandboxes where Node cannot read resident memory or interfaces.
// Do not set NODE_OPTIONS to load this in normal development or production.
try {
  process.memoryUsage();
} catch (error) {
  if (error && error.code === "ENOENT" && error.syscall === "uv_resident_set_memory") {
    const fallback = () => ({ rss: 0, heapTotal: 0, heapUsed: 0, external: 0, arrayBuffers: 0 });
    fallback.rss = () => 0;
    process.memoryUsage = fallback;
  } else {
    throw error;
  }
}

const os = require("node:os");
try {
  os.networkInterfaces();
} catch (error) {
  if (error && error.syscall === "uv_interface_addresses") {
    os.networkInterfaces = () => ({
      lo: [{ address: "127.0.0.1", netmask: "255.0.0.0", family: "IPv4", mac: "00:00:00:00:00:00", internal: true, cidr: "127.0.0.1/8" }],
    });
  } else {
    throw error;
  }
}
