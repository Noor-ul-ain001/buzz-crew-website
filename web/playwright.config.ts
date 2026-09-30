import { defineConfig, devices } from "@playwright/test";

// End-to-end tests expect the web app on :3000 and the API on :8000, with a fake
// email provider (EMAIL_PROVIDER=fake). See specs/001-project-inquiry-flow/quickstart.md.
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "mobile", use: { ...devices["Pixel 7"], viewport: { width: 360, height: 740 } } },
  ],
});
