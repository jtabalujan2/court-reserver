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
   * Add a user to the reservation
   */
  async addUser(): Promise<void> {
    console.log("👥 Adding user...");

    // Click "Add Users" button (note the leading space in the name)
    await this.page.getByRole("button", { name: " Add Users" }).click();
    await this.page.waitForTimeout(500);

    // Click the first "Add" button (there may be multiple, use nth(1) for the second one)
    console.log("   Clicking Add button...");
    await this.page.getByRole("button", { name: "Add" }).nth(1).click();
    await this.page.waitForTimeout(500);

    console.log("✅ User added");
  }

  /**
   * Click Next to proceed to booking
   */
  async clickNext(): Promise<void> {
    console.log("⏭️  Clicking Next...");
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
   * Cancel the booking (for test mode)
   * Handles the iframe confirmation dialog
   */
  async cancelBooking(): Promise<void> {
    console.log("❌ Canceling booking (test mode)...");
    
    // Click the Cancel button (black basic button)
    await this.page.locator('button.ui.button.basic.black.tiny.fluid').click();
    await this.page.waitForTimeout(500);
    
    // Wait for the confirmation iframe to appear
    console.log("   Waiting for confirmation dialog...");
    const iframe = this.page.frameLocator('iframe').first();
    
    // Click Yes in the iframe
    console.log("   Confirming cancellation...");
    await iframe.getByRole("button", { name: "Yes" }).click();
    
    console.log("✅ Test completed - booking was canceled");
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
