import { Page } from 'puppeteer';
import {
  setupPage,
  clearInput,
  typeInInput,
  focusInput,
  getInputDisplayText,
  setCursorOffset,
  waitForReact,
} from '../helpers/input';
import {
  expectDisplayText,
  expectDisplayTextContains,
} from '../helpers/assertions';
import { SEL } from '../helpers/selectors';
import { getBrowser, getBaseUrl } from '../helpers/test-env';

describe('History Navigation', () => {
  let page: Page;

  beforeEach(async () => {
    page = await getBrowser().newPage();
    await setupPage(page, getBaseUrl());
    await clearInput(page);
  });

  afterEach(async () => {
    await page.close();
  });

  it('should load first history item on ArrowUp in empty input', async () => {
    await focusInput(page);
    await setCursorOffset(page, 0);
    await waitForReact(page);
    await page.keyboard.press('ArrowUp');
    await waitForReact(page);

    const text = await getInputDisplayText(page);
    expect(text.length).toBeGreaterThan(0);
  });

  it('should load next history item on second ArrowUp', async () => {
    await focusInput(page);
    await setCursorOffset(page, 0);
    await waitForReact(page);
    await page.keyboard.press('ArrowUp');
    await waitForReact(page);

    const firstItem = await getInputDisplayText(page);
    expect(firstItem.length).toBeGreaterThan(0);

    // After loading history, cursor is at end; for second ArrowUp, need cursor at end
    // (isNavigatingHistory && isCursorAtEnd) condition
    await page.keyboard.press('ArrowUp');
    await waitForReact(page);

    const secondItem = await getInputDisplayText(page);
    expect(secondItem.length).toBeGreaterThan(0);
    expect(secondItem).not.toBe(firstItem);
  });

  it('should return to previous history item on ArrowDown', async () => {
    await focusInput(page);
    await setCursorOffset(page, 0);
    await waitForReact(page);
    await page.keyboard.press('ArrowUp');
    await waitForReact(page);

    const firstItem = await getInputDisplayText(page);

    await page.keyboard.press('ArrowUp');
    await waitForReact(page);

    await page.keyboard.press('ArrowDown');
    await waitForReact(page);

    const afterDown = await getInputDisplayText(page);
    expect(afterDown).toBe(firstItem);
  });

  it('should restore draft text after navigating history and returning with ArrowDown', async () => {
    await typeInInput(page, 'my draft');
    await waitForReact(page);

    // Move cursor to start so ArrowUp triggers history navigation
    await setCursorOffset(page, 0);
    await waitForReact(page);

    await page.keyboard.press('ArrowUp');
    await waitForReact(page);

    const historyItem = await getInputDisplayText(page);
    expect(historyItem).not.toBe('my draft');

    await page.keyboard.press('ArrowDown');
    await waitForReact(page);

    await expectDisplayText(page, 'my draft', 'Draft should be restored after returning from history');
  });

  it('should move cursor within multiline text instead of navigating history when cursor is in middle', async () => {
    await typeInInput(page, 'line1');
    await page.keyboard.down('Shift');
    await page.keyboard.press('Enter');
    await page.keyboard.up('Shift');
    await page.keyboard.type('line2', { delay: 20 });
    await waitForReact(page);

    const textBefore = await getInputDisplayText(page);
    expect(textBefore).toContain('line1');
    expect(textBefore).toContain('line2');

    // Cursor is at end of line2. ArrowUp should move cursor up within text, not navigate history.
    await page.keyboard.press('ArrowUp');
    await waitForReact(page);

    const textAfter = await getInputDisplayText(page);
    expect(textAfter).toBe(textBefore);
  });

  it('should navigate history when cursor is at start of single-line input', async () => {
    await typeInInput(page, 'some text');
    await waitForReact(page);

    // Move cursor to start so ArrowUp triggers history
    await setCursorOffset(page, 0);
    await waitForReact(page);

    await page.keyboard.press('ArrowUp');
    await waitForReact(page);

    const text = await getInputDisplayText(page);
    // History navigation should have replaced the text
    expect(text).not.toBe('some text');
    expect(text.length).toBeGreaterThan(0);
  });
});
