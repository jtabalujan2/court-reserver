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
      "https://app.playbypoint.com/book/ipicklewhittiernarrows?skip_waivers=true"
    );
  }

  /**
   * Login with email and password
   */
  async login(email: string, password: string): Promise<void> {
    const iframe = await this.getLoginIframe();

    // Get iframe locators
    const emailInput = iframe.getByRole("textbox", { name: "Email" });
    const passwordInput = iframe.getByRole("textbox", { name: "Password" });
    const signInButton = iframe.getByRole("button", { name: "Sign in" });

    // Wait for iframe to load
    await emailInput.waitFor({ state: "visible" });

    // Fill in credentials
    await emailInput.fill(email);
    await passwordInput.fill(password);

    // Click sign in
    await signInButton.click();

    // Wait for navigation to complete
    await this.page.waitForLoadState("networkidle");
  }
}
