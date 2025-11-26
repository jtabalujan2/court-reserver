import { Page, Locator } from "playwright";

/**
 * Page Object for the Login page
 * Handles authentication through iframe
 */
export class LoginPage {
  readonly page: Page;

  // Note: Login iframe locators are accessed dynamically since they're in an iframe

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Get the login iframe
   */
  private getLoginIframe() {
    return this.page
      .locator("div")
      .filter({ hasText: "Enter your account ServicesServices" })
      .locator("iframe")
      .contentFrame();
  }

  /**
   * Navigate to the booking page
   */
  async goto(): Promise<void> {
    await this.page.goto(
      "https://app.playbypoint.com/book/ipicklewhittiernarrows?skip_waivers=true",
      { waitUntil: "networkidle" }
    );
  }

  /**
   * Login with email and password
   */
  async login(email: string, password: string): Promise<void> {
    // Wait extra time for page to fully load in Lambda
    await this.page.waitForTimeout(5000);
    
    // Debug: Check page content
    const bodyText = await this.page.locator('body').textContent();
    console.log("📄 Page text (first 500 chars):", bodyText?.substring(0, 500));
    
    const iframeCount = await this.page.locator('iframe').count();
    console.log("🖼️  Iframe count on page:", iframeCount);
    
    // Wait for iframe to be attached to the DOM (longer timeout for Lambda)
    const iframeLocator = this.page
      .locator("div")
      .filter({ hasText: "Enter your account ServicesServices" })
      .locator("iframe");

    const iframeExists = await iframeLocator.count();
    console.log("🔍 Login iframe found:", iframeExists > 0);
    
    if (iframeExists === 0) {
      // Try alternative: maybe user is already logged in or page layout changed
      const hasSignInText = await this.page.getByText("Sign in").isVisible().catch(() => false);
      console.log("🔑 Has 'Sign in' text visible:", hasSignInText);
      throw new Error("Login iframe not found on page. Possible reasons: 1) Already logged in, 2) Page layout changed, 3) Headless detection");
    }

    await iframeLocator.waitFor({ state: "attached", timeout: 30000 });

    const iframe = await this.getLoginIframe();

    // Get iframe locators
    const emailInput = iframe.getByRole("textbox", { name: "Email" });
    const passwordInput = iframe.getByRole("textbox", { name: "Password" });
    const signInButton = iframe.getByRole("button", { name: "Sign in" });

    // Wait for iframe to load (longer timeout for Lambda)
    await emailInput.waitFor({ state: "visible", timeout: 30000 });

    // Fill in credentials
    await emailInput.fill(email);
    await passwordInput.fill(password);

    // Click sign in and wait for navigation
    await signInButton.click();
    await this.page.waitForLoadState("networkidle");
  }
}
