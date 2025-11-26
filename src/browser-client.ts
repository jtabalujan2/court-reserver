import { chromium, Browser, BrowserContext, Page } from "playwright";

export interface BrowserOptions {
  apiKey: string;
  local?: boolean;
  headed?: boolean;
}

export class BrowserClient {
  private readonly apiKey: string;
  private readonly local: boolean;
  private readonly headed: boolean;
  private browser?: Browser;
  private context?: BrowserContext;
  private page?: Page;

  constructor(options: BrowserOptions) {
    this.apiKey = options.apiKey;
    this.local = options.local ?? false;
    this.headed = options.headed ?? false;
  }

  async connect(): Promise<Page> {
    if (this.local) {
      // Local Playwright for testing
      this.browser = await chromium.launch({
        headless: !this.headed,
        slowMo: this.headed ? 100 : 0, // Slow down actions in headed mode
      });
    } else {
      // Browsercat for production (legacy - now using Lambda)
      const url = "wss://api.browsercat.com/connect";
      try {
        // Add timeout to prevent hanging
        this.browser = await Promise.race([
          chromium.connect(url, {
            headers: { "Api-Key": this.apiKey },
            timeout: 60000, // 60 second timeout
          }),
          new Promise<never>((_, reject) =>
            setTimeout(
              () => reject(new Error("Browsercat connection timeout after 60s")),
              60000
            )
          ),
        ]);
      } catch (error) {
        console.error("❌ Browsercat connection failed:", error);
        throw new Error(
          `Failed to connect to Browsercat: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
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

