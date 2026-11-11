import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",

  fullyParallel: false,

  forbidOnly: Boolean(process.env.CI),

  retries: process.env.CI ? 2 : 0,

  workers: 1,

  reporter: process.env.CI
    ? [["github"], ["html", { open: "never" }]]
    : [["list"], ["html", { open: "never" }]],

  timeout: 30_000,

  expect: {
    timeout: 10_000,
  },

  use: {
    baseURL: "http://127.0.0.1:5173",

    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },

  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
      },
    },
    {
      name: "mobile-chromium",
      use: {
        ...devices["Pixel 7"],
      },
    },
  ],

  webServer: [
    {
      command: "npm run dev -w @chatroom/server",
      url: "http://127.0.0.1:3001",
      reuseExistingServer: false,
      timeout: 60_000,
      env: {
        CLIENT_ORIGIN: "http://127.0.0.1:5173",
        RATE_LIMIT_ROOM_CREATE: "1000",
        RATE_LIMIT_ROOM_JOIN: "1000",
        RATE_LIMIT_CHAT_SEND: "1000",
      },
    },
    {
      command: "npm run dev -w @chatroom/client -- --host 127.0.0.1",
      url: "http://127.0.0.1:5173",
      reuseExistingServer: false,
      timeout: 60_000,
      env: {
        VITE_SOCKET_URL: "http://127.0.0.1:3001",
      },
    },
  ],
});
