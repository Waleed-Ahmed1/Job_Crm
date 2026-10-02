import path from "node:path";
import { defineConfig } from "vitest/config";
export default defineConfig({ resolve: { alias: { "@": path.resolve(import.meta.dirname, "src"), "server-only": path.resolve(import.meta.dirname, "tests/server-only.ts") } }, test: { environment: "node", exclude: ["tests/e2e/**", "node_modules/**"], coverage: { reporter: ["text", "html"] } } });
