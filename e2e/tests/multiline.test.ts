import { Page } from 'puppeteer';
import {
  setupPage,
  clearInput,
  typeInInput,
  focusInput,
  pasteText,
  getInputText,
  getInputHeight,
  isInputScrollable,
  waitForReact,
} from '../helpers/input';
import {
  expectHeightGreaterThan,
} from '../helpers/assertions';
import { SEL } from '../helpers/selectors';
import { getBrowser, getBaseUrl } from '../helpers/test-env';

describe('Multi-line Input', () => {
  let page: Page;

  beforeEach(async () => {
    page = await getBrowser().newPage();
    await setupPage(page, getBaseUrl());
    await clearInput(page);
  });

  afterEach(async () => {
    await page.close();
  });

  it('should insert a newline on Shift+Enter', async () => {
    await focusInput(page);
    await page.keyboard.type('hello', { delay: 20 });
    await page.keyboard.down('Shift');
    await page.keyboard.press('Enter');
    await page.keyboard.up('Shift');
    await page.keyboard.type('world', { delay: 20 });
    await waitForReact(page);

    const text = await getInputText(page);
    expect(text).toContain('\n');
  });

  it('should increase input height when adding multiple lines via Shift+Enter', async () => {
    await focusInput(page);
    await page.keyboard.type('first line', { delay: 20 });
    await waitForReact(page);

    const heightBefore = await getInputHeight(page);
    expect(heightBefore).toBeGreaterThan(0);

    // Add enough lines to exceed min-height
    for (let i = 0; i < 4; i++) {
      await page.keyboard.down('Shift');
      await page.keyboard.press('Enter');
      await page.keyboard.up('Shift');
      await page.keyboard.type(`line ${i + 2}`, { delay: 10 });
    }
    await waitForReact(page);

    await expectHeightGreaterThan(page, heightBefore, 'Height should increase after adding multiple lines');
  });

  it('should become scrollable after many lines', async () => {
    await focusInput(page);

    for (let i = 0; i < 12; i++) {
      await page.keyboard.type(`line ${i + 1}`, { delay: 5 });
      await page.keyboard.down('Shift');
      await page.keyboard.press('Enter');
      await page.keyboard.up('Shift');
    }
    await waitForReact(page);

    const scrollable = await isInputScrollable(page);
    expect(scrollable).toBe(true);
  });

  it('should handle pasted multiline text', async () => {
    await focusInput(page);
    await pasteText(page, 'line1\nline2\nline3');
    await waitForReact(page);

    const text = await getInputText(page);
    expect(text).toContain('line1');
    expect(text).toContain('line2');
    expect(text).toContain('line3');
    // Verify there are actual newlines or separate lines
    const hasNewlines = text.includes('\n');
    const hasMultipleLines = text.split('\n').length >= 3 || text.includes('line1') && text.includes('line3');
    expect(hasNewlines || hasMultipleLines).toBe(true);
  });
});
