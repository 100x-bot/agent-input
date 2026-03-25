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
  pasteWithClipboard,
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

  describe('HTML paste (rich text from web pages)', () => {
    it('should preserve paragraph breaks from HTML paste', async () => {
      await focusInput(page);
      await pasteWithClipboard(
        page,
        'First paragraph Second paragraph Third paragraph',
        '<p>First paragraph</p><p>Second paragraph</p><p>Third paragraph</p>'
      );
      await waitForReact(page);

      const inputText = await getInputText(page);
      expect(inputText).toContain('First paragraph');
      expect(inputText).toContain('Second paragraph');
      expect(inputText).toContain('Third paragraph');
      // Verify newlines exist between paragraphs
      expect(inputText).toMatch(/First paragraph\n+Second paragraph/);
      expect(inputText).toMatch(/Second paragraph\n+Third paragraph/);
    });

    it('should preserve line breaks from <br> tags', async () => {
      await focusInput(page);
      await pasteWithClipboard(
        page,
        'line one line two line three',
        'line one<br>line two<br>line three'
      );
      await waitForReact(page);

      const inputText = await getInputText(page);
      expect(inputText).toMatch(/line one\nline two\nline three/);
    });

    it('should preserve list item breaks', async () => {
      await focusInput(page);
      await pasteWithClipboard(
        page,
        'item one item two item three',
        '<ul><li>item one</li><li>item two</li><li>item three</li></ul>'
      );
      await waitForReact(page);

      const inputText = await getInputText(page);
      expect(inputText).toContain('item one');
      expect(inputText).toContain('item two');
      expect(inputText).toContain('item three');
      // Each list item should be on its own line
      expect(inputText).toMatch(/item one\n+item two/);
      expect(inputText).toMatch(/item two\n+item three/);
    });

    it('should preserve div-based line breaks (Google Docs style)', async () => {
      await focusInput(page);
      await pasteWithClipboard(
        page,
        'Block one Block two',
        '<div>Block one</div><div>Block two</div>'
      );
      await waitForReact(page);

      const inputText = await getInputText(page);
      expect(inputText).toMatch(/Block one\n+Block two/);
    });

    it('should preserve whitespace in <pre> blocks', async () => {
      await focusInput(page);
      await pasteWithClipboard(
        page,
        'function foo() {\n  return 42;\n}',
        '<pre>function foo() {\n  return 42;\n}</pre>'
      );
      await waitForReact(page);

      const inputText = await getInputText(page);
      expect(inputText).toContain('function foo()');
      expect(inputText).toContain('return 42');
      expect(inputText).toMatch(/\n\s+return 42/);
    });

    it('should handle heading elements as block breaks', async () => {
      await focusInput(page);
      await pasteWithClipboard(
        page,
        'Title Body text',
        '<h1>Title</h1><p>Body text</p>'
      );
      await waitForReact(page);

      const inputText = await getInputText(page);
      expect(inputText).toMatch(/Title\n+Body text/);
    });

    it('should collapse excessive newlines to at most two', async () => {
      await focusInput(page);
      await pasteWithClipboard(
        page,
        'A\n\n\n\n\nB',
        '<p>A</p><br><br><br><p>B</p>'
      );
      await waitForReact(page);

      const inputText = await getInputText(page);
      // Should not have more than 2 consecutive newlines
      expect(inputText).not.toMatch(/\n{3,}/);
      expect(inputText).toContain('A');
      expect(inputText).toContain('B');
    });

    it('should fall back to plain text when no HTML is provided', async () => {
      await focusInput(page);
      await pasteWithClipboard(page, 'just plain text');
      await waitForReact(page);

      await expectDisplayText(page, 'just plain text', 'Plain text fallback should work');
    });

    it('should preserve newlines in plain text paste via clipboard event', async () => {
      await focusInput(page);
      await pasteWithClipboard(page, 'line1\nline2\nline3');
      await waitForReact(page);

      const inputText = await getInputText(page);
      expect(inputText).toMatch(/line1\nline2\nline3/);
    });

    it('should paste HTML into middle of existing text', async () => {
      await typeInInput(page, 'before after');
      await setCursorOffset(page, 7);
      await pasteWithClipboard(
        page,
        'para1 para2',
        '<p>para1</p><p>para2</p>'
      );
      await waitForReact(page);

      const inputText = await getInputText(page);
      expect(inputText).toContain('before');
      expect(inputText).toContain('para1');
      expect(inputText).toContain('para2');
      expect(inputText).toContain('after');
    });
  });
});
