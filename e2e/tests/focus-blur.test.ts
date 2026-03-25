import { Page } from 'puppeteer';
import {
  setupPage,
  clearInput,
  typeInInput,
  focusInput,
  insertMentionChip,
  insertViaAddButton,
  isMentionsDropdownVisible,
  waitForReact,
  waitForMentionsDropdown,
} from '../helpers/input';
import {
  expectFocused,
  expectMentionsVisible,
} from '../helpers/assertions';
import { SEL } from '../helpers/selectors';
import { getBrowser, getBaseUrl } from '../helpers/test-env';

describe('Focus/Blur Behavior', () => {
  let page: Page;

  beforeEach(async () => {
    page = await getBrowser().newPage();
    await setupPage(page, getBaseUrl());
    await clearInput(page);
  });

  afterEach(async () => {
    await page.close();
  });

  it('should focus input when clicked', async () => {
    await page.click(SEL.input);
    await waitForReact(page);

    await expectFocused(page, true, 'Input should be focused after clicking');
  });

  it('should blur input and hide mentions when clicking outside', async () => {
    await focusInput(page);
    await expectFocused(page, true, 'Input should be focused initially');

    // Click on the heading element outside the input using page.click for real mouse event
    const h1 = await page.$('h1');
    if (h1) {
      await h1.click();
    } else {
      // Fallback: click at top of page
      await page.mouse.click(10, 10);
    }

    await waitForReact(page);

    // Verify blur by checking if input lost focus
    const focused = await page.evaluate((sel) => {
      return document.activeElement === document.querySelector(sel);
    }, '[role="textbox"][aria-label="Message input"]');
    expect(focused).toBe(false);
    await expectMentionsVisible(page, false, 'Mentions dropdown should be hidden after blur');
  });

  it('should remain focused after selecting a mention from dropdown', async () => {
    await focusInput(page);
    await page.keyboard.type('@', { delay: 20 });

    await waitForMentionsDropdown(page, true);
    await expectMentionsVisible(page, true, 'Mentions dropdown should appear after typing @');

    // Click the first mention option
    const options = await page.$$(SEL.mentionOption);
    expect(options.length).toBeGreaterThan(0);
    await options[0].click();
    await waitForReact(page);

    await expectFocused(page, true, 'Input should remain focused after selecting a mention');
  });

  it('should remain focused after selecting from + button dropdown', async () => {
    await focusInput(page);
    await insertViaAddButton(page, 'file', 0);
    await waitForReact(page);

    await expectFocused(page, true, 'Input should be focused after inserting via + button');
  });
});
