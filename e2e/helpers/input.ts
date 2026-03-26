import { Page } from 'puppeteer';
import { SEL } from './selectors';

/**
 * Navigate to the demo page and wait for the input to be ready.
 */
export async function setupPage(page: Page, baseUrl: string): Promise<void> {
  await page.goto(baseUrl, { waitUntil: 'networkidle0' });
  await page.waitForSelector(SEL.input, { timeout: 10000 });
}

/**
 * Clear the input completely using select-all + delete.
 */
export async function clearInput(page: Page): Promise<void> {
  await page.click(SEL.input);
  // Close any open dropdowns first
  await page.keyboard.press('Escape');
  await page.evaluate((sel) => {
    const input = document.querySelector(sel) as HTMLElement;
    if (input) {
      input.textContent = '';
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }, SEL.input);
  // Wait for React to process
  await page.waitForFunction(
    (sel) => {
      const input = document.querySelector(sel);
      return input && input.textContent === '';
    },
    { timeout: 5000 },
    SEL.input
  );
}

/**
 * Focus the input element.
 */
export async function focusInput(page: Page): Promise<void> {
  await page.click(SEL.input);
  await page.waitForFunction(
    (sel) => document.activeElement === document.querySelector(sel),
    { timeout: 5000 },
    SEL.input
  );
}

/**
 * Type text into the input using real keystrokes.
 */
export async function typeInInput(page: Page, text: string): Promise<void> {
  const focused = await isInputFocused(page);
  if (!focused) {
    await focusInput(page);
  }
  await page.keyboard.type(text, { delay: 20 });
}

/**
 * Get the full text content of the input (including chip raw references).
 */
export async function getInputText(page: Page): Promise<string> {
  return page.evaluate((sel) => {
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
  }, SEL.input);
}

/**
 * Get the visible text content of the input (display text, not raw references).
 */
export async function getInputDisplayText(page: Page): Promise<string> {
  return page.evaluate((sel) => {
    const input = document.querySelector(sel) as HTMLElement;
    return input ? input.textContent || '' : '';
  }, SEL.input);
}

/**
 * Get cursor position as text offset using computeTextOffset logic.
 */
export async function getCursorOffset(page: Page): Promise<number> {
  return page.evaluate((sel) => {
    const input = document.querySelector(sel) as HTMLElement;
    if (!input) return -1;

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return -1;

    const range = selection.getRangeAt(0);
    if (!input.contains(range.startContainer)) return -1;

    // Walk the DOM to compute text offset
    let offset = 0;
    let found = false;

    const walk = (parent: Node): boolean => {
      for (let i = 0; i < parent.childNodes.length; i++) {
        if (found) return true;
        const child = parent.childNodes[i];

        if (parent === range.startContainer && i === range.startOffset) {
          found = true;
          return true;
        }

        if (child === range.startContainer) {
          if (child.nodeType === Node.TEXT_NODE) {
            offset += range.startOffset;
            found = true;
            return true;
          }
          found = true;
          return true;
        }

        if (child.nodeType === Node.TEXT_NODE) {
          offset += (child.textContent || '').length;
        } else if (child.nodeType === Node.ELEMENT_NODE) {
          const el = child as HTMLElement;
          if (el.hasAttribute('data-reference')) {
            offset += (el.getAttribute('data-reference') || '').length;
          } else if (el.tagName === 'BR') {
            offset += 1;
          } else {
            if (walk(el)) return true;
          }
        }
      }
      if (parent === range.startContainer && parent.childNodes.length === range.startOffset) {
        found = true;
        return true;
      }
      return false;
    };

    walk(input);
    return offset;
  }, SEL.input);
}

/**
 * Set cursor at a specific text offset.
 */
export async function setCursorOffset(page: Page, targetOffset: number): Promise<void> {
  await page.evaluate((sel, offset) => {
    const input = document.querySelector(sel) as HTMLElement;
    if (!input) return;

    let remaining = offset;
    const walk = (parent: Node): { node: Node, offset: number } | null => {
      for (let i = 0; i < parent.childNodes.length; i++) {
        const child = parent.childNodes[i];
        if (child.nodeType === Node.TEXT_NODE) {
          const len = (child.textContent || '').length;
          if (remaining <= len) {
            return { node: child, offset: remaining };
          }
          remaining -= len;
        } else if (child.nodeType === Node.ELEMENT_NODE) {
          const el = child as HTMLElement;
          if (el.hasAttribute('data-reference')) {
            const refLen = (el.getAttribute('data-reference') || '').length;
            if (remaining === 0) {
              return { node: parent, offset: i };
            }
            if (remaining <= refLen) {
              return { node: parent, offset: i + 1 };
            }
            remaining -= refLen;
          } else if (el.tagName === 'BR') {
            if (remaining === 0) {
              return { node: parent, offset: i };
            }
            if (remaining <= 1) {
              return { node: parent, offset: i + 1 };
            }
            remaining -= 1;
          } else {
            const result = walk(el);
            if (result) return result;
          }
        }
      }
      return null;
    };

    const pos = walk(input) || { node: input, offset: input.childNodes.length };
    const sel2 = window.getSelection()!;
    const range = document.createRange();
    range.setStart(pos.node, pos.offset);
    range.collapse(true);
    sel2.removeAllRanges();
    sel2.addRange(range);
  }, SEL.input, targetOffset);
}

/**
 * Set cursor right after a chip (by chip index, 0-based).
 */
export async function setCursorAfterChip(page: Page, chipIndex: number): Promise<void> {
  await page.evaluate((sel, idx) => {
    const input = document.querySelector(sel) as HTMLElement;
    if (!input) return;
    const chips = input.querySelectorAll('[data-reference]');
    const chip = chips[idx];
    if (!chip) return;

    const textAfter = chip.nextSibling;
    const selection = window.getSelection()!;
    const range = document.createRange();

    if (textAfter && textAfter.nodeType === Node.TEXT_NODE) {
      range.setStart(textAfter, 0);
    } else {
      // Cursor right after chip in parent
      const parent = chip.parentNode!;
      const childIndex = Array.from(parent.childNodes).indexOf(chip);
      range.setStart(parent, childIndex + 1);
    }
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
  }, SEL.input, chipIndex);
}

/**
 * Set cursor right before a chip (by chip index, 0-based).
 */
export async function setCursorBeforeChip(page: Page, chipIndex: number): Promise<void> {
  await page.evaluate((sel, idx) => {
    const input = document.querySelector(sel) as HTMLElement;
    if (!input) return;
    const chips = input.querySelectorAll('[data-reference]');
    const chip = chips[idx];
    if (!chip) return;

    const textBefore = chip.previousSibling;
    const selection = window.getSelection()!;
    const range = document.createRange();

    if (textBefore && textBefore.nodeType === Node.TEXT_NODE) {
      range.setStart(textBefore, (textBefore.textContent || '').length);
    } else {
      const parent = chip.parentNode!;
      const childIndex = Array.from(parent.childNodes).indexOf(chip);
      range.setStart(parent, childIndex);
    }
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
  }, SEL.input, chipIndex);
}

/**
 * Insert a mention chip by typing @ and selecting from the dropdown.
 * Returns the display text of the inserted chip.
 */
export async function insertMentionChip(
  page: Page,
  type: 'tab' | 'file' | 'workflow',
  index: number = 0
): Promise<string> {
  await page.keyboard.type('@', { delay: 20 });

  // Wait for mentions dropdown
  await page.waitForSelector(SEL.mentionsDropdown, { timeout: 5000 });

  // Get all options and find the right section
  const options = await page.$$(SEL.mentionOption);

  // The dropdown order is: tabs, files, workflows
  // Each section has items. We need to find the right offset.
  const sectionOrder = ['tab', 'file', 'workflow'];
  const sectionSizes: Record<string, number> = { tab: 3, file: 3, workflow: 3 }; // From mockConfig
  let offset = 0;
  for (const s of sectionOrder) {
    if (s === type) break;
    offset += sectionSizes[s] || 0;
  }

  const targetIndex = offset + index;
  if (targetIndex < options.length) {
    // Get the display text before clicking
    const displayText = await options[targetIndex].evaluate(el => el.textContent || '');
    await options[targetIndex].click();
    // Wait for chip to appear
    await page.waitForSelector(SEL.chip, { timeout: 5000 });
    return displayText.trim();
  }
  throw new Error(`Mention option not found: type=${type}, index=${index}, total options=${options.length}`);
}

/**
 * Insert a chip via the + button dropdown.
 */
export async function insertViaAddButton(
  page: Page,
  type: 'tab' | 'file' | 'workflow',
  index: number = 0
): Promise<string> {
  // Dismiss any existing dropdowns first
  await page.keyboard.press('Escape');
  await waitForReact(page);

  // Click the + button by triggering its onClick directly
  await page.evaluate((sel) => {
    const btn = document.querySelector(sel) as HTMLElement;
    if (btn) btn.click();
  }, SEL.addButton);

  // Wait for the Add items listbox to appear
  await page.waitForSelector('[role="listbox"][aria-label="Add items"]', { timeout: 5000 });

  // Wait for dropdown options to appear (use any role="option" descendant of the add button's parent)
  await page.waitForFunction(
    () => {
      // The add button dropdown uses role="listbox" with aria-label="Add items"
      const listbox = document.querySelector('[role="listbox"][aria-label="Add items"]');
      if (listbox) return listbox.querySelectorAll('[role="option"]').length > 0;
      // Fallback: look for any role="option" near the add button
      return document.querySelectorAll('[role="option"]').length > 0;
    },
    { timeout: 5000 }
  );

  // Get all options within the add dropdown specifically
  let options = await page.$$('[role="listbox"][aria-label="Add items"] [role="option"]');
  if (options.length === 0) {
    // Fallback to any options on page
    options = await page.$$('[role="option"]');
  }

  // The add dropdown shows tabs, files, workflows in sections
  const sectionOrder = ['tab', 'file', 'workflow'];
  const sectionSizes: Record<string, number> = { tab: 3, file: 3, workflow: 3 };
  let offset = 0;
  for (const s of sectionOrder) {
    if (s === type) break;
    offset += sectionSizes[s] || 0;
  }

  const targetIndex = offset + index;
  if (targetIndex < options.length) {
    const displayText = await options[targetIndex].evaluate(el => el.textContent || '');
    await options[targetIndex].click();
    // Wait for chip
    await page.waitForSelector(SEL.chip, { timeout: 5000 });
    return displayText.trim();
  }
  throw new Error(`Add button option not found: type=${type}, index=${index}, total options=${options.length}`);
}

/**
 * Get all chips in the input.
 */
export async function getChips(page: Page): Promise<Array<{ reference: string; displayText: string }>> {
  return page.evaluate((sel) => {
    const input = document.querySelector(sel) as HTMLElement;
    if (!input) return [];
    const chips = input.querySelectorAll('[data-reference]');
    return Array.from(chips).map(chip => ({
      reference: chip.getAttribute('data-reference') || '',
      displayText: chip.textContent || '',
    }));
  }, SEL.input);
}

/**
 * Get chip count.
 */
export async function getChipCount(page: Page): Promise<number> {
  return page.evaluate((sel) => {
    const input = document.querySelector(sel) as HTMLElement;
    if (!input) return 0;
    return input.querySelectorAll('[data-reference]').length;
  }, SEL.input);
}

/**
 * Check if mentions dropdown is visible.
 */
export async function isMentionsDropdownVisible(page: Page): Promise<boolean> {
  return page.evaluate((sel) => {
    const dropdown = document.querySelector(sel);
    return dropdown !== null;
  }, SEL.mentionsDropdown);
}

/**
 * Check if input is focused.
 */
export async function isInputFocused(page: Page): Promise<boolean> {
  return page.evaluate((sel) => {
    return document.activeElement === document.querySelector(sel);
  }, SEL.input);
}

/**
 * Paste text into the focused element using execCommand (bypasses paste handler).
 */
export async function pasteText(page: Page, text: string): Promise<void> {
  // For multiline text, insert line by line with <br> between
  if (text.includes('\n')) {
    await page.evaluate((text) => {
      const lines = text.split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (i > 0) {
          document.execCommand('insertLineBreak');
        }
        if (lines[i]) {
          document.execCommand('insertText', false, lines[i]);
        }
      }
    }, text);
  } else {
    await page.evaluate((text) => {
      document.execCommand('insertText', false, text);
    }, text);
  }
}

/**
 * Simulate a real paste event with clipboardData containing text/plain and optionally text/html.
 * This triggers the actual onPaste handler in RichInput.
 */
export async function pasteWithClipboard(page: Page, plain: string, html?: string): Promise<void> {
  await page.evaluate((sel, plainText, htmlText) => {
    const input = document.querySelector(sel) as HTMLElement;
    if (!input) return;

    const clipboardData = new DataTransfer();
    clipboardData.setData('text/plain', plainText);
    if (htmlText) {
      clipboardData.setData('text/html', htmlText);
    }

    const pasteEvent = new ClipboardEvent('paste', {
      bubbles: true,
      cancelable: true,
      clipboardData,
    });

    input.dispatchEvent(pasteEvent);
  }, SEL.input, plain, html || '');
}

/**
 * Select all text in the input.
 */
export async function selectAll(page: Page): Promise<void> {
  await page.evaluate((sel) => {
    const input = document.querySelector(sel) as HTMLElement;
    if (input) {
      const selection = window.getSelection()!;
      selection.selectAllChildren(input);
    }
  }, SEL.input);
}

/**
 * Get the scroll position of the page.
 */
export async function getPageScrollTop(page: Page): Promise<number> {
  return page.evaluate(() => document.documentElement.scrollTop || document.body.scrollTop);
}

/**
 * Wait for the mentions dropdown to appear or disappear.
 */
export async function waitForMentionsDropdown(page: Page, visible: boolean): Promise<void> {
  if (visible) {
    await page.waitForSelector(SEL.mentionsDropdown, { timeout: 5000 });
  } else {
    await page.waitForFunction(
      (sel) => !document.querySelector(sel),
      { timeout: 5000 },
      SEL.mentionsDropdown
    );
  }
}

/**
 * Get the height of the input element.
 */
export async function getInputHeight(page: Page): Promise<number> {
  return page.evaluate((sel) => {
    const input = document.querySelector(sel) as HTMLElement;
    return input ? input.offsetHeight : 0;
  }, SEL.input);
}

/**
 * Check if the input is scrollable (content overflows).
 */
export async function isInputScrollable(page: Page): Promise<boolean> {
  return page.evaluate((sel) => {
    const input = document.querySelector(sel) as HTMLElement;
    if (!input) return false;
    // Check the scrollable parent container
    let el: HTMLElement | null = input;
    while (el) {
      if (el.scrollHeight > el.clientHeight + 2) return true;
      el = el.parentElement;
    }
    return false;
  }, SEL.input);
}

/**
 * Small wait for React to process state updates.
 * Only use when waitForSelector/waitForFunction isn't applicable.
 */
export async function waitForReact(page: Page): Promise<void> {
  await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 100)));
}
