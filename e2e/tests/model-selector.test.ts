import { Page } from 'puppeteer';
import {
  clearInput,
  focusInput,
  setupPage,
  waitForMentionsDropdown,
  waitForReact,
} from '../helpers/input';
import { SEL } from '../helpers/selectors';
import { getBaseUrl, getBrowser } from '../helpers/test-env';

describe('Model selector popover ownership', () => {
  let page: Page;

  beforeEach(async () => {
    page = await getBrowser().newPage();
    await setupPage(page, getBaseUrl());
    await clearInput(page);
  });

  afterEach(async () => {
    await page.close();
  });

  it('dismisses an active mention and restores input focus after closing', async () => {
    await focusInput(page);
    await page.keyboard.type('@');
    await waitForMentionsDropdown(page, true);

    await page.click(SEL.modelButton);
    await page.waitForSelector(SEL.modelDropdown, { visible: true });
    await waitForMentionsDropdown(page, false);

    const focusWhileOpen = await page.evaluate(() =>
      document.activeElement?.getAttribute('aria-label')
    );
    expect(focusWhileOpen).toBe('Search models');

    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Escape');
    await page.waitForSelector(SEL.modelDropdown, { hidden: true });
    await waitForReact(page);

    const stateAfterClose = await page.evaluate((inputSelector, suggestionsSelector) => ({
      inputFocused: document.activeElement === document.querySelector(inputSelector),
      suggestions: document.querySelectorAll(suggestionsSelector).length,
    }), SEL.input, SEL.mentionsDropdown);

    expect(stateAfterClose).toEqual({ inputFocused: true, suggestions: 0 });

    // A subsequent edit should allow a fresh suggestion session; dismissal must
    // not leave TipTap's plugin active-but-unrendered or permanently suppressed.
    await page.keyboard.type(' @');
    await waitForMentionsDropdown(page, true);
  });

  it('filters by name, id, and provider and selects from the filtered results with the keyboard', async () => {
    await page.click(SEL.modelButton);
    await page.waitForSelector(SEL.modelSearch, { visible: true });

    const assertVisibleModels = async (query: string, expectedNames: string[]) => {
      await page.click(SEL.modelSearch, { clickCount: 3 });
      await page.keyboard.press('Backspace');
      await page.keyboard.type(query);
      await page.waitForFunction((optionSelector, names) => {
        const visibleNames = Array.from(document.querySelectorAll(optionSelector))
          .map((option) => option.textContent?.trim());
        return JSON.stringify(visibleNames) === JSON.stringify(names);
      }, {}, SEL.modelDropdown + ' [role="option"]', expectedNames);
    };

    await assertVisibleModels('sonnet', ['Claude Sonnet 4.6']);
    await assertVisibleModels('gemini-2.5-flash', ['Gemini 2.5 Flash']);
    await assertVisibleModels('cohere', ['Command R+']);
    await assertVisibleModels('gii', ['GPT-5 Mini', 'Gemini 2.5 Pro', 'Gemini 2.5 Flash']);
    await assertVisibleModels('g25f', ['Gemini 2.5 Flash']);
    await assertVisibleModels('chre', ['Command R+']);
    await assertVisibleModels('iig', []);
    await assertVisibleModels('chre', ['Command R+']);

    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await page.waitForSelector(SEL.modelDropdown, { hidden: true });

    const selectedTrigger = await page.$eval(SEL.modelButton, (button) => ({
      label: button.getAttribute('aria-label'),
      text: button.textContent?.trim(),
    }));
    expect(selectedTrigger).toEqual({
      label: 'Change model, Command R+',
      text: 'Command R+',
    });

    await page.click(SEL.modelButton);
    await page.keyboard.type('cohere');
    const selectedOption = await page.$eval(
      SEL.modelDropdown + ' [role="option"]',
      (option) => option.getAttribute('aria-selected')
    );
    expect(selectedOption).toBe('true');
  });

  it('shows an empty state and resets the query after closing', async () => {
    await page.click(SEL.modelButton);
    await page.keyboard.type('not-a-real-model');
    await page.waitForFunction((selector) =>
      document.querySelector(selector)?.textContent?.includes('No models match “not-a-real-model”'),
      {},
      SEL.modelDropdown
    );

    await page.keyboard.press('Escape');
    await page.waitForSelector(SEL.modelDropdown, { hidden: true });
    await page.click(SEL.modelButton);

    const reopenedState = await page.evaluate((searchSelector, optionSelector) => ({
      query: (document.querySelector(searchSelector) as HTMLInputElement)?.value,
      optionCount: document.querySelectorAll(optionSelector).length,
    }), SEL.modelSearch, SEL.modelDropdown + ' [role="option"]');

    expect(reopenedState).toEqual({ query: '', optionCount: 9 });
  });

  it.each([400, 900])('keeps a recognizable model label visible at %ipx', async (width) => {
    await page.setViewport({ width, height: 800 });
    await page.reload({ waitUntil: 'networkidle0' });
    await page.waitForSelector(SEL.modelButton);

    const dimensions = await page.$eval(SEL.modelButton, (button) => {
      const label = button.querySelector('span');
      return {
        buttonWidth: button.getBoundingClientRect().width,
        labelWidth: label?.getBoundingClientRect().width ?? 0,
        labelText: label?.textContent,
        ariaLabel: button.getAttribute('aria-label'),
        title: button.getAttribute('title'),
      };
    });

    expect(dimensions.buttonWidth).toBeGreaterThanOrEqual(104);
    expect(dimensions.labelWidth).toBeGreaterThanOrEqual(64);
    expect(dimensions.labelText).toBe('Claude Sonnet 4.6');
    expect(dimensions.ariaLabel).toBe('Change model, Claude Sonnet 4.6');
    expect(dimensions.title).toBe('Claude Sonnet 4.6');
  });
});
