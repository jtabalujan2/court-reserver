import { chromium } from "playwright";

export class BrowsercatClient {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.url = "wss://api.browsercat.com/connect";
  }

  async connect() {
    this.browser = await chromium.connect(this.url, {
      headers: { "Api-Key": this.apiKey },
    });

    this.context = await this.browser.newContext({
      viewport: { width: 1280, height: 900 },
    });

    this.page = await this.context.newPage();
    return this.page;
  }

  async close() {
    if (this.browser) await this.browser.close();
  }
}
