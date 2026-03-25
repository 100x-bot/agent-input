import { Page } from 'puppeteer';
import {
  setupPage,
  clearInput,
  typeInInput,
  focusInput,
  insertMentionChip,
  isMentionsDropdownVisible,
  waitForReact,
  waitForMentionsDropdown,
} from '../helpers/input';
import {
  expectMentionsVisible,
  expectChipCount,
} from '../helpers/assertions';
import { SEL } from '../helpers/selectors';
import { getBrowser, getBaseUrl } from '../helpers/test-env';

describe('@ Detection Inside JSON References', () => {
  let page: Page;

  beforeEach(async () => {
    page = await getBrowser().newPage();
    await setupPage(page, getBaseUrl());
    await clearInput(page);
  });

  afterEach(async () => {
    await page.close();
  });

  it('should NOT trigger mentions dropdown when typing after a tab chip containing @ in URL', async () => {
    await focusInput(page);
    // Insert a tab chip (tabs often have URLs like https://github.com with @ in them)
    await insertMentionChip(page, 'tab', 0);
    await waitForReact(page);

    await expectChipCount(page, 1, 'Should have 1 tab chip');

    // Type regular text after the chip — no @ character
    await page.keyboard.type(' hello', { delay: 20 });
    await waitForReact(page);

    const visible = await isMentionsDropdownVisible(page);
    expect(visible).toBe(false);
  });

  it('should NOT trigger mentions dropdown when typing regular text after a workflow chip', async () => {
    await focusInput(page);
    await insertMentionChip(page, 'workflow', 0);
    await waitForReact(page);

    await expectChipCount(page, 1, 'Should have 1 workflow chip');

    await page.keyboard.type(' regular text', { delay: 20 });
    await waitForReact(page);

    await expectMentionsVisible(page, false, 'Mentions should not appear after typing regular text');
  });

  it('should NOT trigger mentions dropdown when typing regular text after a file chip', async () => {
    await focusInput(page);
    await insertMentionChip(page, 'file', 0);
    await waitForReact(page);

    await expectChipCount(page, 1, 'Should have 1 file chip');

    await page.keyboard.type('normal', { delay: 20 });
    await waitForReact(page);

    await expectMentionsVisible(page, false, 'Mentions should not appear after typing normal text');
  });

  it('should trigger mentions dropdown when typing a real @ after a tab chip', async () => {
    await focusInput(page);
    await insertMentionChip(page, 'tab', 0);
    await waitForReact(page);

    await expectChipCount(page, 1, 'Should have 1 tab chip');

    // Type space then @ — this is a real user-typed @ that should trigger mentions
    await page.keyboard.type(' @', { delay: 20 });

    await waitForMentionsDropdown(page, true);
    await expectMentionsVisible(page, true, 'Mentions should appear when user types a real @');
  });
});
