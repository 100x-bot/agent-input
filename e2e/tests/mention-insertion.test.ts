import { Page } from 'puppeteer';
import { setupPage, clearInput, typeInInput, focusInput, insertMentionChip, getChipCount, getChips, isMentionsDropdownVisible, waitForMentionsDropdown, waitForReact, getInputDisplayText } from '../helpers/input';
import { expectChipCount, expectMentionsVisible, expectDisplayTextContains } from '../helpers/assertions';
import { SEL } from '../helpers/selectors';
import { getBrowser, getBaseUrl } from '../helpers/test-env';

describe('Mention chip insertion via @ trigger', () => {
  let page: Page;

  beforeEach(async () => {
    page = await getBrowser().newPage();
    await setupPage(page, getBaseUrl());
    await clearInput(page);
  });

  afterEach(async () => {
    await page.close();
  });

  it('typing @ shows the mentions dropdown', async () => {
    await focusInput(page);
    await page.keyboard.type('@', { delay: 20 });

    await waitForMentionsDropdown(page, true);
    await expectMentionsVisible(page, true);

    const optionCount = await page.$$eval(SEL.mentionOption, (opts) => opts.length);
    expect(optionCount).toBeGreaterThanOrEqual(3);
  });

  it('selecting a file from the dropdown inserts a chip', async () => {
    await focusInput(page);
    const chipText = await insertMentionChip(page, 'file', 0);

    const chipCount = await getChipCount(page);
    expect(chipCount).toBe(1);

    const chips = await getChips(page);
    const hasFileChip = chips.some(
      (c) => c.displayText.includes('report.pdf') || c.displayText.includes('file')
    );
    expect(hasFileChip).toBe(true);

    await expectMentionsVisible(page, false);
  });

  it('selecting a workflow from the dropdown inserts a chip', async () => {
    await focusInput(page);
    const chipText = await insertMentionChip(page, 'workflow', 0);

    await expectChipCount(page, 1);

    const chips = await getChips(page);
    const hasWorkflowChip = chips.some((c) => c.displayText.includes('Summarize Page'));
    expect(hasWorkflowChip).toBe(true);
  });

  it('selecting a tab from the dropdown inserts a chip', async () => {
    await focusInput(page);
    const chipText = await insertMentionChip(page, 'tab', 0);

    await expectChipCount(page, 1);

    const chips = await getChips(page);
    const hasTabChip = chips.some((c) => c.displayText.includes('GitHub'));
    expect(hasTabChip).toBe(true);
  });

  it('pressing Escape closes the dropdown and preserves the @ text', async () => {
    await typeInInput(page, 'hello @');

    await waitForMentionsDropdown(page, true);
    await expectMentionsVisible(page, true);

    await page.keyboard.press('Escape');

    await waitForMentionsDropdown(page, false);
    await expectMentionsVisible(page, false);

    await expectDisplayTextContains(page, 'hello @');
  });

  it('typing @ in the middle of text shows the mentions dropdown', async () => {
    // Type "hello world", then move cursor between "hello" and "world"
    await typeInInput(page, 'hello world');

    // Move cursor to after "hello " (6 characters in)
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('ArrowLeft');
    }

    // Type @ at the cursor position (middle of text)
    await page.keyboard.type('@', { delay: 20 });

    // The mentions dropdown should appear
    await waitForMentionsDropdown(page, true);
    await expectMentionsVisible(page, true);

    const optionCount = await page.$$eval(SEL.mentionOption, (opts) => opts.length);
    expect(optionCount).toBeGreaterThanOrEqual(3);
  });

  it('typing @filter in the middle of text filters mentions correctly', async () => {
    await typeInInput(page, 'check  please');

    // Move cursor to after "check " (6 characters in, between the two spaces)
    for (let i = 0; i < 7; i++) {
      await page.keyboard.press('ArrowLeft');
    }

    // Type @re to trigger filtered mentions
    await page.keyboard.type('@re', { delay: 20 });

    await waitForMentionsDropdown(page, true);
    await expectMentionsVisible(page, true);
  });

  it('@ in the middle of text replaces only the @ portion with a chip', async () => {
    await typeInInput(page, 'before ');
    // Now type @ to trigger mention and select a chip
    const chipDisplayText = await insertMentionChip(page, 'file', 0);
    // Type text after
    await page.keyboard.type(' after', { delay: 20 });
    await waitForReact(page);

    // Assert chip was inserted
    await expectChipCount(page, 1, 'Should have 1 chip');

    // Assert surrounding text is preserved
    const displayText = await getInputDisplayText(page);
    expect(displayText).toContain('before');
    expect(displayText).toContain('after');

    const chips = await getChips(page);
    expect(chips.length).toBe(1);
  });
});
