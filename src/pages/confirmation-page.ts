import { Page, Locator } from "playwright";

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
  readonly confirmYesButton: Locator;

  constructor(page: Page) {
    this.page = page;

    // Initialize locators
    this.addUsersButton = page.getByRole("button", { name: " Add Users" });
    this.addButton = page.getByRole("button", { name: "Add" });
    this.nextButton = page.getByRole("button", { name: "Next" });
    this.bookButton = page.getByRole("button", { name: "Book" });
    this.cancelButton = page.locator("button.ui.button.basic.black.tiny.fluid");
    this.confirmYesButton = page.locator(
      "button.ui.approve.right.labeled.icon.button.green"
    );
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
    await this.confirmYesButton.waitFor({ state: "visible", timeout: 5000 });
    await this.confirmYesButton.click();
  }

  /**
   * Cancel the booking (for test mode)
   * Handles the modal confirmation dialog
   */
  async cancelBooking(): Promise<void> {
    // Click Cancel button
    await this.cancelButton.click();
    await this.page.waitForTimeout(500);

    // Wait for modal to appear and click Yes to confirm cancellation
    await this.confirmYesButton.waitFor({ state: "visible", timeout: 5000 });

    // Click Yes and wait for navigation to reservations page
    await Promise.all([
      this.page.waitForURL("**/account/reservations", { timeout: 10000 }),
      this.confirmYesButton.click(),
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
