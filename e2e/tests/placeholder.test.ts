import { Page } from 'puppeteer';
import {
  setupPage,
  clearInput,
  focusInput,
  waitForReact,
} from '../helpers/input';
import {
  expectPlaceholderVisible,
} from '../helpers/assertions';
import { SEL } from '../helpers/selectors';
import { getBrowser, getBaseUrl } from '../helpers/test-env';

describe('Placeholder Behavior', () => {
  let page: Page;

  beforeEach(async () => {
    page = await getBrowser().newPage();
    await setupPage(page, getBaseUrl());
    await clearInput(page);
  });

  afterEach(async () => {
    await page.close();
  });

  it('should show placeholder when input is empty and not focused', async () => {
    // Blur the input by clicking outside
    await page.evaluate(() => {
      const h1 = document.querySelector('h1');
      if (h1) h1.click();
      else document.body.click();
    });
    await waitForReact(page);

    await expectPlaceholderVisible(page, true, 'Placeholder should be visible when empty and not focused');
  });

  it('should show placeholder when input is empty and focused', async () => {
    await focusInput(page);
    await waitForReact(page);

    await expectPlaceholderVisible(page, true, 'Placeholder should be visible when empty and focused');
  });

  it('should hide placeholder when text is entered', async () => {
    await focusInput(page);
    await page.keyboard.type('a', { delay: 20 });
    await waitForReact(page);

    await expectPlaceholderVisible(page, false, 'Placeholder should be hidden when text is entered');
  });

  it('should show placeholder again after deleting all text', async () => {
    await focusInput(page);
    await page.keyboard.type('a', { delay: 20 });
    await waitForReact(page);

    await expectPlaceholderVisible(page, false, 'Placeholder should be hidden with text');

    await page.keyboard.press('Backspace');
    await waitForReact(page);

    await expectPlaceholderVisible(page, true, 'Placeholder should reappear after deleting all text');
  });
});
