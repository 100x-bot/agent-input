import { Page } from 'puppeteer';
import { clearInput, focusInput, setupPage } from '../helpers/input';
import { SEL } from '../helpers/selectors';
import { getBaseUrl, getBrowser } from '../helpers/test-env';

describe('Async mention refresh', () => {
  let page: Page;

  beforeEach(async () => {
    page = await getBrowser().newPage();
    await setupPage(page, getBaseUrl());
    await clearInput(page);
  });

  afterEach(async () => {
    await page.close();
  });

  it('shows workflow results when they resolve after typing stops', async () => {
    await focusInput(page);
    await page.keyboard.type('@workflow:dashboard');

    await page.waitForFunction(
      (selector) => document.querySelector(selector)?.textContent?.includes('Searching...'),
      { timeout: 5000 },
      SEL.mentionsDropdown,
    );

    await page.waitForFunction(
      (selector) => {
        const text = document.querySelector(selector)?.textContent || '';
        return text.includes('Dashboard Audit') && !text.includes('Searching...');
      },
      { timeout: 5000 },
      SEL.mentionsDropdown,
    );

    expect(await page.$eval(SEL.input, element => element.textContent)).toBe('@workflow:dashboard');
  });

  it('removes the searching state when an empty result resolves', async () => {
    await focusInput(page);
    await page.keyboard.type('@workflow:no-match');

    await page.waitForFunction(
      (selector) => document.querySelector(selector)?.textContent?.includes('Searching...'),
      { timeout: 5000 },
      SEL.mentionsDropdown,
    );

    await page.waitForFunction(
      () => !document.body.textContent?.includes('Searching...'),
      { timeout: 5000 },
    );

    expect(await page.$eval(SEL.input, element => element.textContent)).toBe('@workflow:no-match');
  });
});
