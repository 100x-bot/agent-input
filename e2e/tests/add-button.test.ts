import { Page } from 'puppeteer';
import {
  setupPage,
  clearInput,
  typeInInput,
  focusInput,
  insertMentionChip,
  insertViaAddButton,
  getChipCount,
  getChips,
  getInputDisplayText,
  waitForReact,
} from '../helpers/input';
import {
  expectChipCount,
  expectChipExists,
  expectDisplayTextContains,
} from '../helpers/assertions';
import { SEL } from '../helpers/selectors';
import { getBrowser, getBaseUrl } from '../helpers/test-env';

describe('Reference Chip Insertion via + Button', () => {
  let page: Page;

  beforeEach(async () => {
    page = await getBrowser().newPage();
    await setupPage(page, getBaseUrl());
    await clearInput(page);
  });

  afterEach(async () => {
    await page.close();
  });

  it('should insert a file chip into an empty input via + button', async () => {
    await insertViaAddButton(page, 'file', 0);
    await waitForReact(page);

    await expectChipCount(page, 1, 'Should have 1 chip after inserting via + button');
    const chips = await getChips(page);
    expect(chips.length).toBe(1);
    expect(chips[0].reference).toBeTruthy();
  });

  it('should insert a file chip after existing text via + button', async () => {
    await typeInInput(page, 'hello ');
    await insertViaAddButton(page, 'file', 0);
    await waitForReact(page);

    await expectChipCount(page, 1, 'Should have 1 chip');
    await expectDisplayTextContains(page, 'hello', 'Display text should start with hello');
  });

  it('should insert a file chip alongside an existing workflow chip', async () => {
    await focusInput(page);
    await insertMentionChip(page, 'workflow', 0);
    await waitForReact(page);

    await expectChipCount(page, 1, 'Should have 1 workflow chip');

    await insertViaAddButton(page, 'file', 0);
    await waitForReact(page);

    await expectChipCount(page, 2, 'Should have 2 chips after adding file via + button');
  });

  it('should insert a tab chip alongside an existing workflow chip', async () => {
    await focusInput(page);
    await insertMentionChip(page, 'workflow', 0);
    await waitForReact(page);

    await insertViaAddButton(page, 'tab', 0);
    await waitForReact(page);

    await expectChipCount(page, 2, 'Should have 2 chips total');

    const chips = await getChips(page);
    const references = chips.map(c => c.reference);
    // One should be a workflow reference and one a tab reference
    expect(references.length).toBe(2);
    expect(references[0]).not.toBe(references[1]);
  });

  it('should insert a third chip without corrupting existing chips', async () => {
    await focusInput(page);
    await insertMentionChip(page, 'file', 0);
    await insertMentionChip(page, 'tab', 0);
    await waitForReact(page);

    await expectChipCount(page, 2, 'Should have 2 chips before adding third');

    await insertViaAddButton(page, 'file', 1);
    await waitForReact(page);

    await expectChipCount(page, 3, 'Should have 3 chips after adding via + button');

    const chips = await getChips(page);
    // All chips should have valid references
    for (const chip of chips) {
      expect(chip.reference).toBeTruthy();
      expect(chip.displayText).toBeTruthy();
    }
  });

  it('should open the dropdown when clicking the + button', async () => {
    // Click the + button programmatically
    await page.evaluate((sel) => {
      const btn = document.querySelector(sel) as HTMLElement;
      if (btn) btn.click();
    }, SEL.addButton);

    // Wait for the Add items listbox to appear
    await page.waitForSelector('[role="listbox"][aria-label="Add items"]', { timeout: 5000 });

    const optionCount = await page.evaluate(() => {
      const listbox = document.querySelector('[role="listbox"][aria-label="Add items"]');
      return listbox ? listbox.querySelectorAll('[role="option"]').length : 0;
    });
    expect(optionCount).toBeGreaterThan(0);
  });
});
