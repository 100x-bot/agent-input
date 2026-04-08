import { Page } from 'puppeteer';
import {
  setupPage,
  clearInput,
  typeInInput,
  focusInput,
  insertMentionChip,
  setCursorAfterChip,
  setCursorBeforeChip,
  setCursorOffset,
  getChipCount,
  getChips,
  getInputText,
  getInputDisplayText,
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

  it('should not insert spurious line break when deleting all text between two chips', async () => {
    // Build: text + chip1 + text + chip2 + text
    await focusInput(page);
    await typeInInput(page, 'aaa');
    await insertMentionChip(page, 'file', 0);
    await typeInInput(page, 'bbb');
    await insertMentionChip(page, 'file', 1);
    await typeInInput(page, 'ccc');
    await waitForReact(page);

    await expectChipCount(page, 2, 'Should have 2 chips');

    // Place cursor right before chip2 (after "bbb")
    await setCursorBeforeChip(page, 1);

    // Backspace 3 times to delete "bbb"
    await page.keyboard.press('Backspace');
    await page.keyboard.press('Backspace');
    await page.keyboard.press('Backspace');
    await waitForReact(page);

    // Both chips should still exist
    await expectChipCount(page, 2, 'Both chips should still exist after deleting text between them');

    // Check no spurious newline in the value
    const inputText = await getInputText(page);
    expect(inputText).not.toContain('\n');

    // Verify display is on a single line (no line break)
    const displayText = await getInputDisplayText(page);
    expect(displayText).toContain('aaa');
    expect(displayText).toContain('ccc');
  });

  it('should delete chip correctly when backspacing through text into chip boundary', async () => {
    // Build: text + chip1 + text + chip2 + text
    await focusInput(page);
    await typeInInput(page, 'aaa');
    await insertMentionChip(page, 'file', 0);
    await typeInInput(page, 'bb');
    await insertMentionChip(page, 'file', 1);
    await typeInInput(page, 'ccc');
    await waitForReact(page);

    await expectChipCount(page, 2, 'Should have 2 chips');

    // Place cursor right before chip2 (after "bb")
    await setCursorBeforeChip(page, 1);

    // Backspace 3 times to delete " bb" (space auto-inserted before @trigger + "bb"),
    // then 1 more backspace to also delete the trailing space from chip1 insertion,
    // then 1 more to hit chip1
    await page.keyboard.press('Backspace');
    await page.keyboard.press('Backspace');
    await page.keyboard.press('Backspace');
    await waitForReact(page);

    // Now backspace through the space after chip1 and then delete chip1
    await page.keyboard.press('Backspace');
    await page.keyboard.press('Backspace');
    await waitForReact(page);

    await expectChipCount(page, 1, 'Should have 1 chip after deleting chip1');

    // Remaining chip should be chip2 and text should be intact
    const displayText = await getInputDisplayText(page);
    expect(displayText).toContain('aaa');
    expect(displayText).toContain('ccc');

    // No spurious newlines
    const inputText = await getInputText(page);
    expect(inputText).not.toContain('\n');
  });

  it('should preserve chip integrity when deleting text adjacent to multiple chips', async () => {
    // Build: chip1 + text + chip2 (no leading text)
    await focusInput(page);
    await insertMentionChip(page, 'file', 0);
    await typeInInput(page, 'x');
    await insertMentionChip(page, 'file', 1);
    await waitForReact(page);

    await expectChipCount(page, 2, 'Should have 2 chips');

    // Place cursor after "x" (before chip2)
    await setCursorBeforeChip(page, 1);

    // Delete the single character "x"
    await page.keyboard.press('Backspace');
    await waitForReact(page);

    // Both chips should still exist with no corruption
    await expectChipCount(page, 2, 'Both chips should still exist after deleting single char between them');

    // No spurious newlines
    const inputText = await getInputText(page);
    expect(inputText).not.toContain('\n');
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
