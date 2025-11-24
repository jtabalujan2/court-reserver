import { chromium, Browser, BrowserContext, Page } from "playwright";

export class BrowsercatClient {
  private readonly apiKey: string;
  private readonly url: string;
  private browser?: Browser;
  private context?: BrowserContext;
  private page?: Page;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.url = "wss://api.browsercat.com/connect";
  }

  async connect(): Promise<Page> {
    this.browser = await chromium.connect(this.url, {
      headers: { "Api-Key": this.apiKey },
    });

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

