import { Page } from "playwright";
import { ReservationConfig } from "../types.js";
import { getTargetDate, getDayName } from "../date-utils.js";

/**
 * Page Object for the Reservation selection page
 * Handles date, sport, time slot, and court selection
 */
export class ReservationPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Wait for the reservation page to load
   */
  async waitForPageLoad(): Promise<void> {
    console.log("⏳ Waiting for reservation page to load...");
    await this.page.getByText("Select date and time").waitFor({ state: "visible" });
    console.log("✅ Reservation page loaded");
  }

  /**
   * Select a date from the calendar
   */
  async selectDate(testMode: boolean): Promise<void> {
    const targetDate = getTargetDate(testMode);
    const dayName = getDayName(targetDate);
    const dayNumber = targetDate.getDate().toString();

    console.log(`🎯 Looking for date: ${dayName} ${dayNumber}`);

    const dayButton = this.page.locator(
      `.day-container button:has(.day_name:text("${dayName}")):has(.day_number:text("${dayNumber}"))`
    );

    await dayButton.waitFor({ state: "visible" });
    await dayButton.click();
    console.log(`✅ Selected date: ${dayName} ${dayNumber}`);
  }

  /**
   * Select Pickleball as the sport type
   */
  async selectSportType(): Promise<void> {
    const pickleballButton = this.page.locator(
      'button.ButtonOption:has-text("Pickleball")'
    );
    await pickleballButton.waitFor({ state: "visible" });

    // Check if already selected
    const isSelected = await pickleballButton.evaluate((el) =>
      el.classList.contains("primary")
    );

    if (!isSelected) {
      await pickleballButton.click();
      console.log("✅ Selected Pickleball");
    } else {
      console.log("ℹ️  Pickleball already selected");
    }
  }

  /**
   * Select ALL time slots to book a 2-hour block
   * The system requires selecting all 4 consecutive 30-min slots
   */
  async selectTimeSlot(config: ReservationConfig, testMode: boolean): Promise<void> {
    // Wait for times to load
    await this.page.waitForTimeout(1000);

    console.log(`⏰ Booking 2-hour block (4 x 30-min slots)...`);
    
    let selectedCount = 0;
    
    for (const timeSlot of config.timeSlots) {
      console.log(`   Selecting slot: ${timeSlot}`);

      const timeSlotButton = this.page.getByRole("button", { name: timeSlot });

      const isVisible = await timeSlotButton.isVisible().catch(() => false);
      if (isVisible) {
        const isDisabled = await timeSlotButton.isDisabled().catch(() => true);
        if (!isDisabled) {
          await timeSlotButton.click();
          selectedCount++;
          console.log(`   ✅ Selected: ${timeSlot}`);
        } else {
          console.log(`   ⏭️  ${timeSlot} is disabled`);
        }
      } else {
        console.log(`   ⏭️  ${timeSlot} not found`);
      }
    }

    if (selectedCount === 0) {
      const timeRange = testMode ? "2:00-4:00 PM" : "7:00-9:00 PM";
      throw new Error(`No available time slots found (tried ${timeRange})`);
    }
    
    console.log(`✅ Selected ${selectedCount} time slot(s) for 2-hour booking`);
  }

  /**
   * Select a specific court
   */
  async selectCourt(courtName: string): Promise<void> {
    // Wait for court details to load
    await this.page.waitForTimeout(500);

    console.log(`🎾 Looking for ${courtName}`);

    // Use exact match to avoid matching PB Court 10, 11, etc.
    const courtButton = this.page.getByRole("button", {
      name: courtName,
      exact: true,
    });

    await courtButton.waitFor({ state: "visible", timeout: 5000 });
    await courtButton.click();
    console.log(`✅ Selected court: ${courtName}`);
  }

  /**
   * Click the Next button to proceed
   */
  async clickNext(): Promise<void> {
    console.log("⏭️  Clicking Next...");
    await this.page.getByRole("button", { name: "Next" }).click();
    await this.page.waitForTimeout(500);
  }
}

