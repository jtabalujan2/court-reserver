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
    // Wait for iframe to be attached to the DOM
    const iframeLocator = this.page
      .locator("div")
      .filter({ hasText: "Enter your account ServicesServices" })
      .locator("iframe");

    await iframeLocator.waitFor({ state: "attached", timeout: 10000 });

    const iframe = await this.getLoginIframe();

    // Get iframe locators
    const emailInput = iframe.getByRole("textbox", { name: "Email" });
    const passwordInput = iframe.getByRole("textbox", { name: "Password" });
    const signInButton = iframe.getByRole("button", { name: "Sign in" });

    // Wait for iframe to load
    await emailInput.waitFor({ state: "visible", timeout: 10000 });

    // Fill in credentials
    await emailInput.fill(email);
    await passwordInput.fill(password);

    // Click sign in and wait for navigation
    await signInButton.click();
    await this.page.waitForLoadState("networkidle");
  }
}
