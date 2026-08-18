import { Page } from 'puppeteer';
import { clearInput, focusInput, setupPage, typeInInput, waitForReact } from '../helpers/input';
import { SEL } from '../helpers/selectors';
import { getBaseUrl, getBrowser } from '../helpers/test-env';

async function selectStatus(page: Page, label: string): Promise<void> {
  await page.evaluate((text) => {
    const button = Array.from(document.querySelectorAll<HTMLButtonElement>('[role="radio"]'))
      .find(element => element.textContent?.trim() === text);
    button?.click();
  }, label);
  await waitForReact(page);
}

async function getSendCount(page: Page): Promise<number> {
  return page.$eval(SEL.sendCount, element => Number(element.getAttribute('data-send-count')));
}

describe('Send/Cancel control', () => {
  let page: Page;

  beforeEach(async () => {
    page = await getBrowser().newPage();
    await setupPage(page, getBaseUrl());
    await clearInput(page);
  });

  afterEach(async () => {
    await page.close();
  });

  it('uses the success state and a minimum 44px target for a valid idle prompt', async () => {
    await typeInInput(page, 'Run this once');
    const metrics = await page.$eval(SEL.sendButton, (button) => {
      const rect = button.getBoundingClientRect();
      return {
        width: rect.width,
        height: rect.height,
        action: button.getAttribute('data-action'),
        background: getComputedStyle(button).backgroundColor,
      };
    });

    expect(metrics.width).toBeGreaterThanOrEqual(44);
    expect(metrics.height).toBeGreaterThanOrEqual(44);
    expect(metrics.action).toBe('send');
    expect(metrics.background).toBe('rgb(21, 128, 61)');
  });

  it('submits only once on rapid double activation', async () => {
    await typeInInput(page, 'Only once');
    await page.click(SEL.sendButton, { clickCount: 2, delay: 10 });
    await waitForReact(page);

    expect(await getSendCount(page)).toBe(1);
  });

  it('blocks Enter while working and reports the rejection', async () => {
    await selectStatus(page, 'Working');
    await focusInput(page);
    await page.keyboard.type('Do not queue this');
    await page.keyboard.press('Enter');
    await waitForReact(page);

    expect(await getSendCount(page)).toBe(0);
    const diagnostic = await page.$eval(SEL.lastInteraction, element => element.textContent || '');
    expect(diagnostic).toContain('submit-rejected');
    expect(diagnostic).toContain('working');
  });

  it('shows a red cancellable Stop control while working', async () => {
    await selectStatus(page, 'Working');
    await new Promise(resolve => setTimeout(resolve, 250));
    const state = await page.$eval(SEL.cancelButton, (button) => ({
      disabled: (button as HTMLButtonElement).disabled,
      action: button.getAttribute('data-action'),
      background: getComputedStyle(button).backgroundColor,
      width: button.getBoundingClientRect().width,
      height: button.getBoundingClientRect().height,
    }));

    expect(state.disabled).toBe(false);
    expect(state.action).toBe('cancel');
    const dangerToken = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--ai-button-danger-bg').trim()
    );
    const tokenColor = await page.evaluate((color) => {
      const probe = document.createElement('div');
      probe.style.color = color;
      document.body.appendChild(probe);
      const resolved = getComputedStyle(probe).color;
      probe.remove();
      return resolved;
    }, dangerToken);
    expect(state.background).toBe(tokenColor);
    expect(state.width).toBeGreaterThanOrEqual(44);
    expect(state.height).toBeGreaterThanOrEqual(44);
  });

  it('disables cancellation when the active step cannot be cancelled', async () => {
    await selectStatus(page, 'Working (locked)');
    const disabled = await page.$eval(SEL.cancelButton, (button) => (button as HTMLButtonElement).disabled);
    expect(disabled).toBe(true);
  });

  it('does not swallow the first click after editing the focused TipTap input', async () => {
    await typeInInput(page, 'Send thiz');
    await page.keyboard.press('Backspace');
    await page.keyboard.type('s');
    await page.click(SEL.sendButton);
    await waitForReact(page);

    expect(await getSendCount(page)).toBe(1);
  });
});
