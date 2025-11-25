import { Page, Locator, FrameLocator } from "playwright";

/**
 * Page Object for the Confirmation/Booking page
 * Handles add users step and final booking confirmation
 */
export class ConfirmationPage {
  readonly page: Page;

  // Locators
  readonly addUsersButton: Locator;
  readonly addButton: Locator;
  readonly nextButton: Locator;
  readonly bookButton: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    this.page = page;

    // Initialize locators
    this.addUsersButton = page.getByRole("button", { name: " Add Users" });
    this.addButton = page.getByRole("button", { name: "Add" });
    this.nextButton = page.getByRole("button", { name: "Next" });
    this.bookButton = page.getByRole("button", { name: "Book" });
    this.cancelButton = page.locator("button.ui.button.basic.black.tiny.fluid");
  }

  /**
   * Get the confirmation iframe
   */
  private getConfirmationIframe(): FrameLocator {
    return this.page.frameLocator("iframe").first();
  }

  /**
   * Add a user to the reservation
   */
  async addUser(): Promise<void> {
    // Click "Add Users" button (note the leading space in the name)
    await this.addUsersButton.click();
    await this.page.waitForTimeout(500);

    // Click the first "Add" button (there may be multiple, use nth(1) for the second one)
    await this.addButton.nth(1).click();
    await this.page.waitForTimeout(500);
  }

  /**
   * Click Next to proceed to booking
   */
  async clickNext(): Promise<void> {
    await this.nextButton.click();
    await this.page.waitForTimeout(500);
  }

  /**
   * Click the Book button
   */
  async clickBook(): Promise<void> {
    await this.bookButton.click();
  }

  /**
   * Confirm the booking by clicking Yes
   */
  async confirmBooking(): Promise<void> {
    // Get iframe and Yes button
    const iframe = this.getConfirmationIframe();
    const yesButton = iframe.locator("button.ui.approve.button.green");

    await yesButton.click();
  }

  /**
   * Cancel the booking (for test mode)
   * Handles the iframe confirmation dialog
   */
  async cancelBooking(): Promise<void> {
    // Click Cancel button
    await this.cancelButton.click();
    await this.page.waitForTimeout(500);

    // Wait for iframe and click Yes to confirm cancellation
    const iframe = this.getConfirmationIframe();
    const yesButton = iframe.locator("button.ui.approve.button.green");
    await yesButton.waitFor({ state: "visible", timeout: 5000 });

    // Click Yes and wait for navigation to reservations page
    await Promise.all([
      this.page.waitForURL("**/account/reservations", { timeout: 10000 }),
      yesButton.click(),
    ]);
  }

  /**
   * Complete the entire confirmation flow
   * In test mode, cancels at the end instead of confirming
   */
  async completeBooking(testMode: boolean = false): Promise<void> {
    await this.addUser();
    await this.clickNext();
    await this.clickBook();

    if (testMode) {
      await this.cancelBooking();
    } else {
      await this.confirmBooking();
    }
  }
}
