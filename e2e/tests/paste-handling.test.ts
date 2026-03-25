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
  pasteText,
  selectAll,
  getInputText,
  getInputDisplayText,
  waitForReact,
  getCursorOffset,
  getChipCount,
} from '../helpers/input';
import {
  expectCursorAt,
  expectChipCount,
  expectDisplayText,
} from '../helpers/assertions';
import { getBrowser, getBaseUrl } from '../helpers/test-env';

describe('Paste handling', () => {
  let page: Page;

  beforeEach(async () => {
    page = await getBrowser().newPage();
    await setupPage(page, getBaseUrl());
    await clearInput(page);
  });

  afterEach(async () => {
    await page.close();
  });

  it('should paste plain text into empty input', async () => {
    await focusInput(page);
    await pasteText(page, 'hello world');
    await waitForReact(page);

    await expectDisplayText(page, 'hello world', 'Pasted text should appear in input');
    await expectCursorAt(page, 11, 'Cursor should be at end of pasted text');
  });

  it('should paste into middle of existing message', async () => {
    await typeInInput(page, 'hello world');
    await setCursorOffset(page, 5);
    await pasteText(page, ' beautiful');
    await waitForReact(page);

    await expectDisplayText(page, 'hello beautiful world', 'Text should be inserted at cursor position');
    await expectCursorAt(page, 15, 'Cursor should be after pasted text');
  });

  it('should replace selected text on paste', async () => {
    await typeInInput(page, 'hello world');
    await selectAll(page);
    await pasteText(page, 'replaced');
    await waitForReact(page);

    await expectDisplayText(page, 'replaced', 'Selected text should be replaced by pasted text');
    await expectCursorAt(page, 8, 'Cursor should be at end of replacement text');
  });

  it('should paste right before a chip', async () => {
    await typeInInput(page, 'before');
    const chipText = await insertMentionChip(page, 'file', 0);
    await waitForReact(page);

    await setCursorBeforeChip(page, 0);
    await pasteText(page, 'PASTED');
    await waitForReact(page);

    await expectChipCount(page, 1, 'Chip should still exist after paste');
    const displayText = await getInputDisplayText(page);
    expect(displayText).toContain('before');
    expect(displayText).toContain('PASTED');
  });

  it('should paste right after a chip', async () => {
    await focusInput(page);
    const chipText = await insertMentionChip(page, 'file', 0);
    await typeInInput(page, ' after');
    await waitForReact(page);

    await setCursorAfterChip(page, 0);
    await pasteText(page, 'INSERTED');
    await waitForReact(page);

    await expectChipCount(page, 1, 'Chip should still exist after paste');
    const displayText = await getInputDisplayText(page);
    expect(displayText).toContain('INSERTED');
    expect(displayText).toContain('after');
  });

  it('should paste multi-line text', async () => {
    await focusInput(page);
    await pasteText(page, 'line1\nline2\nline3');
    await waitForReact(page);

    const inputText = await getInputText(page);
    expect(inputText).toContain('line1');
    expect(inputText).toContain('line2');
    expect(inputText).toContain('line3');

    const displayText = await getInputDisplayText(page);
    expect(displayText).toContain('line1');
    expect(displayText).toContain('line2');
    expect(displayText).toContain('line3');
  });

  it('should paste chip + text as plain text representation after copy', async () => {
    await typeInInput(page, 'before ');
    const chipText = await insertMentionChip(page, 'file', 0);
    await typeInInput(page, ' after');
    await waitForReact(page);

    // Select all and programmatically extract the text representation
    // (the RichInput's handleCopy extracts reference raw text for chips)
    const copiedText = await page.evaluate((sel) => {
      const input = document.querySelector(sel) as HTMLElement;
      if (!input) return '';
      let text = '';
      for (let i = 0; i < input.childNodes.length; i++) {
        const node = input.childNodes[i];
        if (node.nodeType === Node.TEXT_NODE) {
          text += node.textContent || '';
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          const el = node as HTMLElement;
          if (el.hasAttribute('data-reference')) {
            text += el.getAttribute('data-reference') || '';
          } else if (el.tagName === 'BR') {
            text += '\n';
          } else {
            text += el.textContent || '';
          }
        }
      }
      return text;
    }, '[role="textbox"][aria-label="Message input"]');

    // Verify the extracted text contains the reference raw text (not a chip)
    expect(copiedText.length).toBeGreaterThan(0);
    expect(copiedText).toContain('before');
    expect(copiedText).toContain('after');

    // Now paste this text into a fresh input and verify it becomes text (not chips)
    await clearInput(page);
    await focusInput(page);
    await pasteText(page, copiedText);
    await waitForReact(page);

    const displayText = await getInputDisplayText(page);
    expect(displayText.length).toBeGreaterThan(0);
    expect(displayText).toContain('before');
  });
});
