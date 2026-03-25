import { Page } from 'puppeteer';
import { setupPage, clearInput, typeInInput, focusInput, insertMentionChip, setCursorAfterChip, setCursorBeforeChip, setCursorOffset, getCursorOffset, waitForReact } from '../helpers/input';
import { expectCursorAt, expectChipCount, expectDisplayText } from '../helpers/assertions';
import { getBrowser, getBaseUrl } from '../helpers/test-env';

describe('Cursor position preservation', () => {
  let page: Page;

  beforeEach(async () => {
    page = await getBrowser().newPage();
    await setupPage(page, getBaseUrl());
    await clearInput(page);
  });

  afterEach(async () => {
    await page.close();
  });

  it('cursor stays in middle after parent re-render', async () => {
    // Type text and position cursor in the middle
    await typeInInput(page, 'hello world foo bar');
    await setCursorOffset(page, 5);
    await expectCursorAt(page, 5, 'Cursor should be at offset 5 before re-render');

    // Trigger a parent re-render without losing focus by resizing the window
    const viewport = page.viewport();
    await page.setViewport({ width: (viewport?.width || 800) + 1, height: viewport?.height || 600 });
    await waitForReact(page);
    await page.setViewport({ width: viewport?.width || 800, height: viewport?.height || 600 });
    await waitForReact(page);

    // Cursor should still be at the same position since focus was not lost
    const cursorAfter = await getCursorOffset(page);
    expect(cursorAfter).toBe(5);
  });

  it('cursor stays after mentions dropdown open/close', async () => {
    // Type text and position cursor
    await typeInInput(page, 'hello world');
    await setCursorOffset(page, 5);
    await expectCursorAt(page, 5, 'Cursor should be at offset 5 before typing @');

    // Type "@" to open dropdown
    await page.keyboard.type('@', { delay: 20 });
    await waitForReact(page);

    // Press Escape to close dropdown
    await page.keyboard.press('Escape');
    await waitForReact(page);

    // Cursor should be right after the "@" character, at offset 6
    const cursorOffset = await getCursorOffset(page);
    expect(cursorOffset).toBe(6);
  });

  it('type at end - cursor stays at end', async () => {
    // Type "hello" and verify cursor is at end
    await typeInInput(page, 'hello');
    const cursorAfterHello = await getCursorOffset(page);
    expect(cursorAfterHello).toBe(5);

    // Type " world" and verify cursor advances to the end
    await page.keyboard.type(' world', { delay: 20 });
    const cursorAfterWorld = await getCursorOffset(page);
    expect(cursorAfterWorld).toBe(11);
  });

  it('type before chip - cursor advances', async () => {
    // Type "hello ", insert a file chip, then type " world"
    await typeInInput(page, 'hello ');
    const chipDisplayText = await insertMentionChip(page, 'file', 0);
    await page.keyboard.type(' world', { delay: 20 });

    await expectChipCount(page, 1, 'Should have exactly 1 chip');

    // Set cursor right before the chip (after "hello ")
    await setCursorBeforeChip(page, 0);
    const cursorBeforeTyping = await getCursorOffset(page);

    // Type "abc" before the chip
    await page.keyboard.type('abc', { delay: 20 });
    await waitForReact(page);

    // Cursor should have advanced by 3 characters
    const cursorAfterTyping = await getCursorOffset(page);
    expect(cursorAfterTyping).toBe(cursorBeforeTyping + 3);

    // Verify the text before chip now contains "hello abc"
    const displayText = await page.evaluate((sel) => {
      const input = document.querySelector(sel) as HTMLElement;
      if (!input) return '';
      const chip = input.querySelector('[data-reference]');
      if (!chip) return '';
      // Collect text content before the chip
      let text = '';
      let node = input.firstChild;
      while (node && node !== chip) {
        text += node.textContent || '';
        node = node.nextSibling;
      }
      return text;
    }, '[role="textbox"][aria-label="Message input"]');

    // The space after "hello" may or may not be preserved depending on mention insertion behavior
    expect(displayText).toContain('abc');
  });

  it('type after chip - cursor advances', async () => {
    // Insert a file chip first
    await focusInput(page);
    const chipDisplayText = await insertMentionChip(page, 'file', 0);
    await page.keyboard.type(' some text', { delay: 20 });

    await expectChipCount(page, 1, 'Should have exactly 1 chip');

    // Set cursor right after the chip
    await setCursorAfterChip(page, 0);
    const cursorBeforeTyping = await getCursorOffset(page);

    // Type "xyz" after the chip
    await page.keyboard.type('xyz', { delay: 20 });
    await waitForReact(page);

    // Cursor should have advanced by 3 characters
    const cursorAfterTyping = await getCursorOffset(page);
    expect(cursorAfterTyping).toBe(cursorBeforeTyping + 3);

    // Verify "xyz" appears right after the chip
    const textAfterChip = await page.evaluate((sel) => {
      const input = document.querySelector(sel) as HTMLElement;
      if (!input) return '';
      const chip = input.querySelector('[data-reference]');
      if (!chip) return '';
      const nextSibling = chip.nextSibling;
      if (!nextSibling) return '';
      return nextSibling.textContent || '';
    }, '[role="textbox"][aria-label="Message input"]');

    expect(textAfterChip.startsWith('xyz')).toBe(true);
  });
});
