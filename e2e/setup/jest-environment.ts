import NodeEnvironment from 'jest-environment-node';
import type { JestEnvironmentConfig, EnvironmentContext } from '@jest/environment';
import puppeteer, { Browser } from 'puppeteer';
import path from 'path';
import fs from 'fs';

class PuppeteerEnvironment extends NodeEnvironment {
  private browser: Browser | null = null;

  constructor(config: JestEnvironmentConfig, context: EnvironmentContext) {
    super(config, context);
  }

  async setup() {
    await super.setup();

    const infoPath = path.resolve(__dirname, '.server-info.json');
    const { baseUrl } = JSON.parse(fs.readFileSync(infoPath, 'utf-8'));

    const headless = process.env.HEADLESS !== 'false';
    this.browser = await puppeteer.launch({
      headless,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
      ],
      ...(headless ? {} : { slowMo: 50 }),
    });

    this.global.__BROWSER__ = this.browser;
    this.global.__BASE_URL__ = baseUrl;
  }

  async teardown() {
    if (this.browser) {
      await this.browser.close();
    }
    await super.teardown();
  }

  getVmContext() {
    return super.getVmContext();
  }
}

export default PuppeteerEnvironment;
