const path = require('path');
const { defineConfig } = require('@playwright/test');

const PROJECT_ROOT = path.resolve(__dirname, '..', '..');

module.exports = defineConfig({
  testDir: __dirname,
  testMatch: ['*.spec.js'],
  outputDir: path.resolve(__dirname, 'test-results'),
  timeout: 60000,
  expect: {
    timeout: 10000,
    toHaveScreenshot: {
      animations: 'disabled',
      caret: 'hide',
      maxDiffPixelRatio: 0.01,
    },
  },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['list'],
    ['html', { outputFolder: path.resolve(__dirname, 'playwright-report'), open: 'never' }],
  ],
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
    serviceWorkers: 'block',
    reducedMotion: 'reduce',
    locale: 'id-ID',
    timezoneId: 'Asia/Jakarta',
  },
  webServer: {
    command: `npx http-server ${PROJECT_ROOT} -p 4173 -c-1 --silent`,
    url: 'http://127.0.0.1:4173',
    timeout: 120000,
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    {
      name: 'desktop-light',
      use: {
        viewport: { width: 1440, height: 980 },
        colorScheme: 'light',
      },
    },
    {
      name: 'desktop-dark',
      use: {
        viewport: { width: 1440, height: 980 },
        colorScheme: 'dark',
      },
    },
    {
      name: 'mobile-light',
      use: {
        browserName: 'chromium',
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 3,
        isMobile: true,
        hasTouch: true,
        colorScheme: 'light',
      },
    },
    {
      name: 'mobile-dark',
      use: {
        browserName: 'chromium',
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 3,
        isMobile: true,
        hasTouch: true,
        colorScheme: 'dark',
      },
    },
  ],
});
