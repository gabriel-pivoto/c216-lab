import { defineConfig, devices } from "@playwright/test";

const PORT = 5173;
const BASE_URL = `http://localhost:${PORT}`;
const API_URL = (process.env.VITE_API_URL ?? "http://localhost:8000").replace(/\/+$/, "");
const isCI = Boolean(process.env.CI);

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 1 : undefined,
  reporter: isCI
    ? [["github"], ["html", { open: "never" }]]
    : [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: [
    {
      command: "poetry run uvicorn app.main:app --host 0.0.0.0 --port 8000",
      cwd: "../backend",
      url: `${API_URL}/`,
      reuseExistingServer: !isCI,
      timeout: 60_000,
    },
    {
      command: "npm run dev",
      url: BASE_URL,
      reuseExistingServer: !isCI,
      timeout: 60_000,
    },
  ],
});
