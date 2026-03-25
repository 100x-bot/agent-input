import { Page } from 'puppeteer';
import {
  setupPage,
  clearInput,
  typeInInput,
  focusInput,
  insertMentionChip,
  setCursorAfterChip,
  selectAll,
  getInputDisplayText,
  getChipCount,
  waitForReact,
} from '../helpers/input';
import {
  expectChipCount,
  expectDisplayText,
} from '../helpers/assertions';
import { SEL } from '../helpers/selectors';
import { getBrowser, getBaseUrl } from '../helpers/test-env';

describe('Edge Cases', () => {
  let page: Page;

  beforeEach(async () => {
    page = await getBrowser().newPage();
    await setupPage(page, getBaseUrl());
    await clearInput(page);
  });

  afterEach(async () => {
    await page.close();
  });

  it('should handle rapid typing and deleting', async () => {
    await focusInput(page);
    // Type "hello" fast
    await page.keyboard.type('hello', { delay: 5 });
    await waitForReact(page);

    // Press Backspace 5 times fast
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Backspace');
    }
    await waitForReact(page);

    const text = await getInputDisplayText(page);
    expect(text).toBe('');
  });

  it('should replace all content including chips on Select All + type', async () => {
    await focusInput(page);
    await insertMentionChip(page, 'file', 0);
    await page.keyboard.type(' text', { delay: 20 });
    await waitForReact(page);

    await expectChipCount(page, 1, 'Should have 1 chip before select-all replace');

    await selectAll(page);
    await waitForReact(page);
    await page.keyboard.type('x', { delay: 20 });
    await waitForReact(page);

    await expectChipCount(page, 0, 'All chips should be removed after select-all + type');
    await expectDisplayText(page, 'x', 'Display text should be just "x"');
  });

  it('should delete a chip via Backspace in a chip-only input', async () => {
    await focusInput(page);
    await insertMentionChip(page, 'file', 0);
    // Type @ again to insert another chip
    await insertMentionChip(page, 'tab', 0);
    await waitForReact(page);

    await expectChipCount(page, 2, 'Should have 2 chips');

    // Set cursor after first chip and press Backspace
    await setCursorAfterChip(page, 0);
    await waitForReact(page);
    await page.keyboard.press('Backspace');
    await waitForReact(page);

    await expectChipCount(page, 1, 'Should have 1 chip after deleting via Backspace');
  });

  it('should clear all chips with multiple backspaces', async () => {
    await focusInput(page);
    await insertMentionChip(page, 'file', 0);
    await insertMentionChip(page, 'tab', 0);
    await waitForReact(page);

    await expectChipCount(page, 2, 'Should have 2 chips before clearing');

    // Select all and delete to clear everything
    await selectAll(page);
    await waitForReact(page);
    await page.keyboard.press('Backspace');
    await waitForReact(page);

    await expectChipCount(page, 0, 'All chips should be removed');
    const text = await getInputDisplayText(page);
    expect(text).toBe('');
  });
});
