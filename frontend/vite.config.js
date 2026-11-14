import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    strictPort: true,
    watch: process.env.VITE_WATCH_POLLING === "true" ? { usePolling: true, interval: 300 } : {},
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.js"],
    include: ["tests/unit/**/*.test.{js,jsx}", "tests/integration/**/*.test.{js,jsx}"],
  },
});
