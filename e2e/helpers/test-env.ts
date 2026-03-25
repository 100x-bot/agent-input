import { Browser, Page } from 'puppeteer';

/**
 * Get the Puppeteer browser instance from the test environment.
 */
export function getBrowser(): Browser {
  return (globalThis as Record<string, any>).__BROWSER__ as Browser;
}

/**
 * Get the base URL of the demo app from the test environment.
 */
export function getBaseUrl(): string {
  return (globalThis as Record<string, any>).__BASE_URL__ as string;
}

/**
 * Get the server process from the test environment.
 */
export function getServer(): any {
  return (globalThis as Record<string, any>).__SERVER__;
}
