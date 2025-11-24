import { Page, Locator } from "playwright";
import { ReservationConfig } from "../types.js";
import { getTargetDate, getDayName } from "../date-utils.js";

/**
 * Page Object for the Reservation selection page
 * Handles date, sport, time slot, and court selection
 */
export class ReservationPage {
  readonly page: Page;

  // Locators
  readonly pageHeading: Locator;
  readonly pickleballButton: Locator;
  readonly nextButton: Locator;

  constructor(page: Page) {
    this.page = page;

    // Initialize locators
    this.pageHeading = page.getByText("Select date and time");
    this.pickleballButton = page.locator(
      'button.ButtonOption:has-text("Pickleball")'
    );
    this.nextButton = page.getByRole("button", { name: "Next" });
  }

  /**
   * Wait for the reservation page to load
   */
  async waitForPageLoad(): Promise<void> {
    await this.pageHeading.waitFor({ state: "visible" });
  }

  /**
   * Select a date from the calendar
   */
  async selectDate(testMode: boolean): Promise<void> {
    const targetDate = getTargetDate(testMode);
    const dayName = getDayName(targetDate);
    const dayNumber = targetDate.getDate().toString();

    // Dynamic locator based on calculated date
    const dayButton = this.page.locator(
      `.day-container button:has(.day_name:text("${dayName}")):has(.day_number:text("${dayNumber}"))`
    );

    await dayButton.waitFor({ state: "visible" });
    await dayButton.click();
  }

  /**
   * Select Pickleball as the sport type
   */
  async selectSportType(): Promise<void> {
    await this.pickleballButton.waitFor({ state: "visible" });

    // Check if already selected
    const isSelected = await this.pickleballButton.evaluate((el) =>
      el.classList.contains("primary")
    );

    if (!isSelected) {
      await this.pickleballButton.click();
    }
  }

  /**
   * Select ALL time slots to book a 2-hour block
   * The system requires selecting all 4 consecutive 30-min slots
   */
  async selectTimeSlot(
    config: ReservationConfig,
    testMode: boolean
  ): Promise<void> {
    // Wait for times to load
    await this.page.waitForTimeout(1000);

    let selectedCount = 0;

    for (const timeSlot of config.timeSlots) {
      // Dynamic locator for each time slot
      const timeSlotButton = this.page.getByRole("button", { name: timeSlot });

      const isVisible = await timeSlotButton.isVisible().catch(() => false);
      if (isVisible) {
        const isDisabled = await timeSlotButton.isDisabled().catch(() => true);
        if (!isDisabled) {
          await timeSlotButton.click();
          selectedCount++;
        }
      }
    }

    if (selectedCount === 0) {
      const timeRange = testMode ? "2:00-4:00 PM" : "7:00-9:00 PM";
      throw new Error(`No available time slots found (tried ${timeRange})`);
    }
  }

  /**
   * Select a specific court
   */
  async selectCourt(courtName: string): Promise<void> {
    // Wait for court details to load
    await this.page.waitForTimeout(500);

    // Dynamic locator for the specific court
    const courtButton = this.page.getByRole("button", {
      name: courtName,
      exact: true,
    });

    await courtButton.waitFor({ state: "visible", timeout: 5000 });
    await courtButton.click();
  }

  /**
   * Click the Next button to proceed
   */
  async clickNext(): Promise<void> {
    await this.nextButton.click();
    await this.page.waitForTimeout(500);
  }
}
