import { Page } from 'puppeteer';
import {
  getCursorOffset,
  getInputText,
  getInputDisplayText,
  getChipCount,
  getChips,
  isMentionsDropdownVisible,
  isInputFocused,
  getPageScrollTop,
} from './input';
import { SEL } from './selectors';

// Custom assertion wrapper since Jest doesn't have withContext
function withMessage(actual: any, message: string) {
  return {
    toBe(expected: any) {
      if (actual !== expected) {
        throw new Error(`${message}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
      }
    },
    toBeGreaterThan(expected: number) {
      if (!(actual > expected)) {
        throw new Error(`${message}: expected ${actual} to be greater than ${expected}`);
      }
    },
    toBeGreaterThanOrEqual(expected: number) {
      if (!(actual >= expected)) {
        throw new Error(`${message}: expected ${actual} to be >= ${expected}`);
      }
    },
    toBeTruthy() {
      if (!actual) {
        throw new Error(`${message}: expected truthy, got ${JSON.stringify(actual)}`);
      }
    },
    toBeFalsy() {
      if (actual) {
        throw new Error(`${message}: expected falsy, got ${JSON.stringify(actual)}`);
      }
    },
    toContain(expected: string) {
      if (typeof actual !== 'string' || !actual.includes(expected)) {
        throw new Error(`${message}: expected "${actual}" to contain "${expected}"`);
      }
    },
  };
}

/**
 * Assert cursor is at exact text offset (explicit, no implicit pass).
 */
export async function expectCursorAt(page: Page, expectedOffset: number, message?: string): Promise<void> {
  const actual = await getCursorOffset(page);
  const msg = message || `Cursor position`;
  withMessage(actual, msg).toBe(expectedOffset);
}

/**
 * Assert input raw text (including reference strings) matches exactly.
 */
export async function expectInputText(page: Page, expectedText: string, message?: string): Promise<void> {
  const actual = await getInputText(page);
  const msg = message || `Input text`;
  withMessage(actual, msg).toBe(expectedText);
}

/**
 * Assert input display text (visible text) matches exactly.
 */
export async function expectDisplayText(page: Page, expectedText: string, message?: string): Promise<void> {
  const actual = await getInputDisplayText(page);
  const msg = message || `Display text`;
  withMessage(actual, msg).toBe(expectedText);
}

/**
 * Assert input display text contains a substring.
 */
export async function expectDisplayTextContains(page: Page, substring: string, message?: string): Promise<void> {
  const actual = await getInputDisplayText(page);
  const msg = message || `Display text should contain "${substring}"`;
  withMessage(actual, msg).toContain(substring);
}

/**
 * Assert chip count matches exactly.
 */
export async function expectChipCount(page: Page, expected: number, message?: string): Promise<void> {
  const actual = await getChipCount(page);
  const msg = message || `Chip count`;
  withMessage(actual, msg).toBe(expected);
}

/**
 * Assert a chip with the given display text exists.
 */
export async function expectChipExists(page: Page, displayText: string, message?: string): Promise<void> {
  const chips = await getChips(page);
  const found = chips.some(c => c.displayText.includes(displayText));
  const msg = message || `Chip "${displayText}" should exist`;
  withMessage(found, msg).toBeTruthy();
}

/**
 * Assert a chip with the given display text does NOT exist.
 */
export async function expectChipNotExists(page: Page, displayText: string, message?: string): Promise<void> {
  const chips = await getChips(page);
  const found = chips.some(c => c.displayText.includes(displayText));
  const msg = message || `Chip "${displayText}" should NOT exist`;
  withMessage(found, msg).toBeFalsy();
}

/**
 * Assert mentions dropdown is visible or hidden.
 */
export async function expectMentionsVisible(page: Page, expected: boolean, message?: string): Promise<void> {
  const actual = await isMentionsDropdownVisible(page);
  const msg = message || `Mentions dropdown visibility`;
  withMessage(actual, msg).toBe(expected);
}

/**
 * Assert input is focused or not.
 */
export async function expectFocused(page: Page, expected: boolean, message?: string): Promise<void> {
  const actual = await isInputFocused(page);
  const msg = message || `Input focus state`;
  withMessage(actual, msg).toBe(expected);
}

/**
 * Assert placeholder is visible or hidden.
 */
export async function expectPlaceholderVisible(page: Page, expected: boolean, message?: string): Promise<void> {
  const visible = await page.evaluate((sel) => {
    const input = document.querySelector(sel) as HTMLElement;
    if (!input) return false;
    // The placeholder is a sibling div with pointer-events-none
    const parent = input.parentElement;
    if (!parent) return false;
    const placeholder = parent.querySelector('.pointer-events-none');
    return placeholder !== null;
  }, SEL.input);
  const msg = message || `Placeholder visibility`;
  withMessage(visible, msg).toBe(expected);
}

/**
 * Assert no page scroll happened (within tolerance).
 */
export async function expectNoScroll(page: Page, scrollBefore: number, message?: string): Promise<void> {
  const scrollAfter = await getPageScrollTop(page);
  const msg = message || `Page should not scroll`;
  const diff = Math.abs(scrollAfter - scrollBefore);
  if (diff > 2) {
    throw new Error(`${msg}: scroll changed by ${diff}px (from ${scrollBefore} to ${scrollAfter})`);
  }
}

/**
 * Assert input height increased.
 */
export async function expectHeightGreaterThan(page: Page, previousHeight: number, message?: string): Promise<void> {
  const currentHeight = await page.evaluate((sel) => {
    const input = document.querySelector(sel) as HTMLElement;
    return input ? input.offsetHeight : 0;
  }, SEL.input);
  const msg = message || `Input height should increase`;
  withMessage(currentHeight, msg).toBeGreaterThan(previousHeight);
}
