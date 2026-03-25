import type { Browser } from 'puppeteer';
import type { ChildProcess } from 'child_process';

declare global {
  var __BROWSER__: Browser;
  var __BASE_URL__: string;
  var __SERVER__: ChildProcess;
}
