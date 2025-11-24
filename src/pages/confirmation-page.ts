import { Page } from "playwright";

/**
 * Page Object for the Confirmation/Booking page
 * Handles add users step and final booking confirmation
 */
export class ConfirmationPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Skip adding additional users and proceed to booking
   */
  async skipAddUsers(): Promise<void> {
    console.log("👥 Skipping Add Users step...");
    await this.page.getByRole("button", { name: "Next" }).click();
    await this.page.waitForTimeout(500);
  }

  /**
   * Click the Book button
   */
  async clickBook(): Promise<void> {
    console.log("📝 Clicking Book...");
    await this.page.getByRole("button", { name: "Book" }).click();
  }

  /**
   * Confirm the booking by clicking Yes
   */
  async confirmBooking(): Promise<void> {
    console.log("✅ Confirming booking...");
    await this.page.getByRole("button", { name: "Yes" }).click();
    console.log("🎉 Reservation confirmed!");
  }

  /**
   * Complete the entire confirmation flow
   */
  async completeBooking(): Promise<void> {
    await this.skipAddUsers();
    await this.clickBook();
    await this.confirmBooking();
  }
}

