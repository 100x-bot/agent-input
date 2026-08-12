import { Page } from 'puppeteer';
import {
  clearInput,
  focusInput,
  setupPage,
  waitForMentionsDropdown,
  waitForReact,
} from '../helpers/input';
import { SEL } from '../helpers/selectors';
import { getBaseUrl, getBrowser } from '../helpers/test-env';

describe('Model selector popover ownership', () => {
  let page: Page;

  beforeEach(async () => {
    page = await getBrowser().newPage();
    await setupPage(page, getBaseUrl());
    await clearInput(page);
  });

  afterEach(async () => {
    await page.close();
  });

  it('dismisses an active mention and restores input focus after closing', async () => {
    await focusInput(page);
    await page.keyboard.type('@');
    await waitForMentionsDropdown(page, true);

    await page.click(SEL.modelButton);
    await page.waitForSelector(SEL.modelDropdown, { visible: true });
    await waitForMentionsDropdown(page, false);

    const focusWhileOpen = await page.evaluate(() =>
      document.activeElement?.getAttribute('aria-label')
    );
    expect(focusWhileOpen).toBe('Select model');

    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Escape');
    await page.waitForSelector(SEL.modelDropdown, { hidden: true });
    await waitForReact(page);

    const stateAfterClose = await page.evaluate((inputSelector, suggestionsSelector) => ({
      inputFocused: document.activeElement === document.querySelector(inputSelector),
      suggestions: document.querySelectorAll(suggestionsSelector).length,
    }), SEL.input, SEL.mentionsDropdown);

    expect(stateAfterClose).toEqual({ inputFocused: true, suggestions: 0 });

    // A subsequent edit should allow a fresh suggestion session; dismissal must
    // not leave TipTap's plugin active-but-unrendered or permanently suppressed.
    await page.keyboard.type(' @');
    await waitForMentionsDropdown(page, true);
  });
});
