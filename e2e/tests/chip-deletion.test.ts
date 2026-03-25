import { Page } from 'puppeteer';
import {
  setupPage,
  clearInput,
  typeInInput,
  focusInput,
  insertMentionChip,
  setCursorAfterChip,
  setCursorBeforeChip,
  getChipCount,
  getChips,
  selectAll,
  getPageScrollTop,
  waitForReact,
  getCursorOffset,
} from '../helpers/input';
import {
  expectCursorAt,
  expectChipCount,
  expectChipExists,
  expectChipNotExists,
  expectDisplayText,
  expectInputText,
  expectNoScroll,
} from '../helpers/assertions';
import { getBrowser, getBaseUrl } from '../helpers/test-env';

describe('Chip Deletion', () => {
  let page: Page;

  beforeEach(async () => {
    page = await getBrowser().newPage();
    await setupPage(page, getBaseUrl());
    await clearInput(page);
  });

  afterEach(async () => {
    await page.close();
  });

  it('should remove chip on Backspace when cursor is right after chip', async () => {
    // Type "hello ", insert file chip, type " world"
    await typeInInput(page, 'hello ');
    const chipText = await insertMentionChip(page, 'file', 0);
    await typeInInput(page, ' world');

    // Record scroll position before deletion
    const scrollBefore = await getPageScrollTop(page);

    // Set cursor right after the chip
    await setCursorAfterChip(page, 0);
    await waitForReact(page);

    // Press Backspace to delete the chip
    await page.keyboard.press('Backspace');
    await waitForReact(page);

    // Assert chip is removed
    await expectChipCount(page, 0, 'Chip should be removed after Backspace');

    // Assert text remains (chip deletion may normalize spacing)
    const displayText = await page.evaluate((sel) => {
      const input = document.querySelector(sel) as HTMLElement;
      return input ? input.textContent || '' : '';
    }, '[role="textbox"][aria-label="Message input"]');
    expect(displayText).toMatch(/^hello\s+world$/);

    // Assert cursor is at the correct position
    const cursorOffset = await getCursorOffset(page);
    expect(cursorOffset).toBeGreaterThanOrEqual(5);
    expect(cursorOffset).toBeLessThanOrEqual(7);

    // Assert no page scroll
    await expectNoScroll(page, scrollBefore, 'Page should not scroll after chip deletion');
  });

  it('should remove chip on Delete key when cursor is right before chip', async () => {
    // Type "hello ", insert file chip, type " world"
    await typeInInput(page, 'hello ');
    const chipText = await insertMentionChip(page, 'file', 0);
    await typeInInput(page, ' world');

    // Set cursor right before the chip
    await setCursorBeforeChip(page, 0);
    await waitForReact(page);

    // Press Delete to remove the chip
    await page.keyboard.press('Delete');
    await waitForReact(page);

    // Assert chip is removed
    await expectChipCount(page, 0, 'Chip should be removed after Delete key');

    // Assert text remains (chip deletion may normalize spacing)
    const displayText = await page.evaluate((sel) => {
      const input = document.querySelector(sel) as HTMLElement;
      return input ? input.textContent || '' : '';
    }, '[role="textbox"][aria-label="Message input"]');
    expect(displayText).toMatch(/^hello\s+world$/);
  });

  it('should remove chip when cutting a selection that spans the chip with Cmd+X', async () => {
    // Type "hello ", insert file chip, type " world"
    await typeInInput(page, 'hello ');
    await insertMentionChip(page, 'file', 0);
    await typeInInput(page, ' world');

    // Select all content and cut programmatically
    await focusInput(page);
    await page.evaluate((sel) => {
      const input = document.querySelector(sel) as HTMLElement;
      if (!input) return;
      const selection = window.getSelection()!;
      selection.selectAllChildren(input);
      document.execCommand('delete');
    }, '[role="textbox"][aria-label="Message input"]');
    await waitForReact(page);

    // Assert chip is removed
    await expectChipCount(page, 0, 'Chip should be removed after cut');

    // Assert input is empty
    await expectDisplayText(page, '', 'Input should be empty after cutting all content');
  });

  it('should remove all chips and text on Select All + Delete', async () => {
    // Insert a file chip
    await focusInput(page);
    await insertMentionChip(page, 'file', 0);

    // Insert a tab chip
    await insertMentionChip(page, 'tab', 0);

    // Type some text
    await typeInInput(page, ' text');

    // Verify we have 2 chips before deletion
    await expectChipCount(page, 2, 'Should have 2 chips before deletion');

    // Select all and delete
    await selectAll(page);
    await waitForReact(page);
    await page.keyboard.press('Delete');
    await waitForReact(page);

    // Assert all chips are removed
    await expectChipCount(page, 0, 'All chips should be removed after Select All + Delete');

    // Assert input is empty
    await expectDisplayText(page, '', 'Input should be empty after Select All + Delete');
  });

  it('should replace all content including chips when Select All + type character', async () => {
    // Type "before ", insert file chip, type " after"
    await typeInInput(page, 'before ');
    await insertMentionChip(page, 'file', 0);
    await typeInInput(page, ' after');

    // Verify chip exists before replacement
    await expectChipCount(page, 1, 'Should have 1 chip before replacement');

    // Select all and type a single character
    await focusInput(page);
    await selectAll(page);
    await waitForReact(page);
    await page.keyboard.type('x', { delay: 20 });
    await waitForReact(page);

    // Assert chip is removed
    await expectChipCount(page, 0, 'Chip should be removed after Select All + type');

    // Assert display text is just "x"
    await expectDisplayText(page, 'x', 'Display text should be just the typed character');

    // Assert cursor is at position 1 (after the "x")
    await expectCursorAt(page, 1, 'Cursor should be at position 1 after typing replacement character');
  });

  it('should remove file chip when clicking its X (remove) button', async () => {
    // Insert a file chip
    await focusInput(page);
    await insertMentionChip(page, 'file', 0);

    // Verify chip exists
    await expectChipCount(page, 1, 'Should have 1 chip before clicking remove');

    // Click the remove button inside the chip
    const removeButton = await page.$('[data-reference] [data-remove="true"]');
    expect(removeButton).not.toBeNull();
    await removeButton!.click();
    await waitForReact(page);

    // Assert chip is removed
    await expectChipCount(page, 0, 'Chip should be removed after clicking X button');
  });
});
