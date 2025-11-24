import { chromium, Browser, BrowserContext, Page } from "playwright";

export interface BrowsercatOptions {
  apiKey: string;
  local?: boolean;
  headed?: boolean;
}

export class BrowsercatClient {
  private readonly apiKey: string;
  private readonly url: string;
  private readonly local: boolean;
  private readonly headed: boolean;
  private browser?: Browser;
  private context?: BrowserContext;
  private page?: Page;

  constructor(options: BrowsercatOptions) {
    this.apiKey = options.apiKey;
    this.url = "wss://api.browsercat.com/connect";
    this.local = options.local ?? false;
    this.headed = options.headed ?? false;
  }

  async connect(): Promise<Page> {
    if (this.local) {
      // Local Playwright for testing
      console.log(`🖥️  Launching local browser (headed: ${this.headed})`);
      this.browser = await chromium.launch({
        headless: !this.headed,
        slowMo: this.headed ? 100 : 0, // Slow down actions in headed mode
      });
    } else {
      // Browsercat for production
      console.log("☁️  Connecting to Browsercat...");
      this.browser = await chromium.connect(this.url, {
        headers: { "Api-Key": this.apiKey },
      });
    }

    this.context = await this.browser.newContext({
      viewport: { width: 1280, height: 900 },
    });

    this.page = await this.context.newPage();
    return this.page;
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
    }
  }
}
