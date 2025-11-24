import { Page } from "playwright";

/**
 * Page Object for the Login page
 * Handles authentication through iframe
 */
export class LoginPage {
  readonly page: Page;

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
    console.log("⏳ Waiting for login iframe...");

    const iframe = await this.getLoginIframe();

    // Wait for iframe to load
    await iframe.getByRole("textbox", { name: "Email" }).waitFor();

    // Fill in credentials
    await iframe.getByRole("textbox", { name: "Email" }).fill(email);
    await iframe.getByRole("textbox", { name: "Password" }).fill(password);

    // Click sign in
    await iframe.getByRole("button", { name: "Sign in" }).click();

    console.log("✅ Logged in successfully");

    // Wait for navigation to complete
    await this.page.waitForLoadState("networkidle");
  }
}

