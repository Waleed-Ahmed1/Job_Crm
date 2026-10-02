import { spawn } from "node:child_process";
import { createRequire } from "node:module";
const resolve = createRequire(import.meta.url).resolve;
const server = spawn(process.execPath, [resolve("next/dist/bin/next"), "dev", "--webpack", "--hostname", "127.0.0.1"], {
  stdio: "inherit", env: { ...process.env, NEXT_PUBLIC_DEMO_MODE: "true" }
});
server.on("exit", (code) => process.exit(code ?? 0));
process.on("SIGTERM", () => server.kill("SIGTERM"));
process.on("SIGINT", () => server.kill("SIGINT"));
