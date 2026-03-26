import { Page } from 'puppeteer';
import {
  setupPage,
  clearInput,
  typeInInput,
  focusInput,
  insertMentionChip,
  setCursorBeforeChip,
  setCursorAfterChip,
  setCursorOffset,
  getCursorOffset,
  getInputText,
  getInputDisplayText,
  waitForReact,
} from '../helpers/input';
import {
  expectCursorAt,
  expectChipCount,
} from '../helpers/assertions';
import { getBrowser, getBaseUrl } from '../helpers/test-env';
import { SEL } from '../helpers/selectors';

describe('Cursor at chip boundaries', () => {
  let page: Page;

  beforeEach(async () => {
    page = await getBrowser().newPage();
    await setupPage(page, getBaseUrl());
    await clearInput(page);
  });

  afterEach(async () => {
    await page.close();
  });

  describe('Bug 1: Cursor should not jump after backspacing text before chip', () => {
    it('cursor stays at position 0 after backspacing all text before a chip', async () => {
      await typeInInput(page, 'hello');
      await insertMentionChip(page, 'file', 0);
      await waitForReact(page);

      await setCursorBeforeChip(page, 0);
      await waitForReact(page);

      for (let i = 0; i < 5; i++) {
        await page.keyboard.press('Backspace');
        await waitForReact(page);
      }

      await expectChipCount(page, 1, 'Chip should still exist after deleting text before it');
      await expectCursorAt(page, 0, 'Cursor should be at start of line before chip');
    });

    it('cursor stays at position 0 after backspacing single char before a chip', async () => {
      await typeInInput(page, 'x');
      await insertMentionChip(page, 'file', 0);
      await waitForReact(page);

      await setCursorBeforeChip(page, 0);
      await waitForReact(page);

      await page.keyboard.press('Backspace');
      await waitForReact(page);

      await expectChipCount(page, 1, 'Chip should still exist');
      await expectCursorAt(page, 0, 'Cursor should be at position 0');
    });

    it('setCursorOffset(0) places cursor before chip when chip is first element', async () => {
      await focusInput(page);
      await insertMentionChip(page, 'file', 0);
      await waitForReact(page);

      await setCursorOffset(page, 0);
      await waitForReact(page);

      await expectCursorAt(page, 0, 'setCursorOffset(0) should place cursor before chip');
    });
  });

  describe('Bug 2: Newline should be preserved when inserting chip on next line', () => {
    it('text between chip and newline preserved when inserting chip on next line', async () => {
      await focusInput(page);
      await insertMentionChip(page, 'file', 0);
      await typeInInput(page, 'aaa');
      await waitForReact(page);

      // Shift+Enter for new line
      await page.keyboard.down('Shift');
      await page.keyboard.press('Enter');
      await page.keyboard.up('Shift');
      await waitForReact(page);

      // Verify newline exists before inserting second chip
      const valAfterNewline = await getInputText(page);
      expect(valAfterNewline).toContain('\n');

      // Insert second chip on new line
      await insertMentionChip(page, 'file', 1);
      await waitForReact(page);

      await expectChipCount(page, 2, 'Should have 2 chips');

      const displayText = await getInputDisplayText(page);
      expect(displayText).toContain('aaa');

      const finalText = await getInputText(page);
      expect(finalText).toContain('\n');
    });
  });

  describe('Bug 3: Backspace after chip should not destroy chip', () => {
    it('backspacing trailing space after chip insertion preserves chip', async () => {
      await focusInput(page);
      await insertMentionChip(page, 'file', 0);
      await waitForReact(page);

      await expectChipCount(page, 1, 'Should have 1 chip before backspace');

      // Backspace to remove trailing space
      await page.keyboard.press('Backspace');
      await waitForReact(page);

      // Chip should still exist
      await expectChipCount(page, 1, 'Chip should survive backspace of trailing space');
    });

    it('can type after chip without destroying it via backspace', async () => {
      await focusInput(page);
      await insertMentionChip(page, 'file', 0);
      await waitForReact(page);

      // Type text after chip
      await typeInInput(page, 'hello');
      await waitForReact(page);

      await expectChipCount(page, 1, 'Chip should still exist after typing');

      const displayText = await getInputDisplayText(page);
      expect(displayText).toContain('hello');
    });
  });
});
