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
   * Wait for any modal/dimmer overlays to disappear
   */
  private async waitForModalsToClose(): Promise<void> {
    // Wait for any visible modal dimmers to disappear
    const modalDimmer = this.page.locator(".ui.dimmer.modals.page.visible");
    if (await modalDimmer.isVisible().catch(() => false)) {
      await modalDimmer
        .waitFor({ state: "hidden", timeout: 5000 })
        .catch(() => {
          console.log("⚠️ Modal still visible, continuing anyway");
        });
    }
  }

  /**
   * Handle the "unavailable" modal if it appears
   */
  private async handleUnavailableModal(): Promise<boolean> {
    const unavailableText = this.page.locator(
      "text=Unfortunately this time is not available"
    );
    const isVisible = await unavailableText.isVisible().catch(() => false);

    if (isVisible) {
      console.log("⚠️ Time slot unavailable - closing modal");
      // Look for the close button or "X" in the modal
      const closeButton = this.page
        .locator(
          '.ui.modal .close.icon, .ui.modal button:has-text("Close"), .ui.modal button:has-text("OK")'
        )
        .first();
      if (await closeButton.isVisible().catch(() => false)) {
        await closeButton.click({ force: true }).catch(() => {});
      }
      // Wait for modal to close
      await this.page.waitForTimeout(500);
      return true;
    }
    return false;
  }

  /**
   * Resilient click with multiple strategies
   * Since we've waited for page stability, we can be more aggressive with force clicks
   */
  private async resilientClick(
    locator: Locator,
    timeSlot: string
  ): Promise<boolean> {
    let lastError: Error | null = null;

    // Strategy 1: Force click immediately (since we've already waited for stability)
    // This bypasses the "element not stable" checks which cause most timeouts
    try {
      await this.waitForModalsToClose();
      await locator.click({ force: true, timeout: 10000 });
      console.log(`✅ Clicked ${timeSlot} (force click)`);
      await this.page.waitForTimeout(500);

      // Check if unavailable modal appeared
      if (await this.handleUnavailableModal()) {
        return false; // Slot was unavailable
      }
      return true;
    } catch (err) {
      lastError = err as Error;
      console.log(`⚠️ Force click failed for ${timeSlot}: ${err}`);
    }

    // Strategy 2: JavaScript click (most reliable, bypasses all checks)
    try {
      await this.waitForModalsToClose();
      await locator.evaluate((el) => (el as any).click());
      console.log(`✅ Clicked ${timeSlot} (JavaScript click)`);
      await this.page.waitForTimeout(500);

      if (await this.handleUnavailableModal()) {
        return false;
      }
      return true;
    } catch (err) {
      lastError = err as Error;
      console.log(`⚠️ JavaScript click failed for ${timeSlot}: ${err}`);
    }

    // Strategy 3: Last resort - normal click with longer timeout
    try {
      await this.waitForModalsToClose();
      await locator.click({ timeout: 15000 });
      console.log(`✅ Clicked ${timeSlot} (normal click - last resort)`);
      await this.page.waitForTimeout(500);

      if (await this.handleUnavailableModal()) {
        return false;
      }
      return true;
    } catch (err) {
      lastError = err as Error;
      console.log(`❌ All click strategies failed for ${timeSlot}: ${err}`);
    }

    throw lastError || new Error(`Failed to click ${timeSlot}`);
  }

  /**
   * Wait for the page to stabilize (no rapid DOM changes)
   * This is crucial at 2:00 PM when slots are becoming available and page is updating
   */
  private async waitForPageToStabilize(firstTimeSlot?: string): Promise<void> {
    console.log("⏳ Waiting for page to stabilize...");

    // Wait for network activity to settle
    await this.page.waitForLoadState("networkidle").catch(() => {
      console.log("⚠️ Network not idle, continuing anyway");
    });

    // If we know what we're looking for, wait for it to be stable
    if (firstTimeSlot) {
      const firstButton = this.page.getByRole("button", {
        name: firstTimeSlot,
      });
      // Wait for the button to exist and be attached (but don't fail if it doesn't exist)
      await firstButton
        .waitFor({ state: "attached", timeout: 5000 })
        .catch(() => {
          console.log(`⚠️ First time slot "${firstTimeSlot}" not found yet`);
        });
    }

    // Additional wait for any JavaScript updates/polling to complete
    await this.page.waitForTimeout(2000);

    console.log("✅ Page should be stable now");
  }

  /**
   * Select ALL time slots to book a 2-hour block
   * The system requires selecting all 4 consecutive 30-min slots
   */
  async selectTimeSlot(
    config: ReservationConfig,
    testMode: boolean
  ): Promise<void> {
    // Wait for page to stabilize (critical at 2:00 PM production time)
    await this.waitForPageToStabilize(config.timeSlots[0]);

    let selectedCount = 0;
    let skippedCount = 0;

    for (const timeSlot of config.timeSlots) {
      // Dynamic locator for each time slot
      const timeSlotButton = this.page.getByRole("button", { name: timeSlot });

      const isVisible = await timeSlotButton.isVisible().catch(() => false);
      if (!isVisible) {
        console.log(`⚠️ Time slot ${timeSlot} not visible, skipping`);
        skippedCount++;
        continue;
      }

      const isDisabled = await timeSlotButton.isDisabled().catch(() => true);
      if (isDisabled) {
        console.log(`⚠️ Time slot ${timeSlot} is disabled, skipping`);
        skippedCount++;
        continue;
      }

      // Try to click with resilient strategies
      try {
        const success = await this.resilientClick(timeSlotButton, timeSlot);
        if (success) {
          selectedCount++;
        } else {
          console.log(`⚠️ Time slot ${timeSlot} was unavailable`);
          skippedCount++;
        }
      } catch (err) {
        console.log(`❌ Failed to click ${timeSlot}: ${err}`);
        skippedCount++;
      }

      // Small delay between clicks
      await this.page.waitForTimeout(200);
    }

    console.log(
      `📊 Selected ${selectedCount} time slots, skipped ${skippedCount}`
    );

    if (selectedCount === 0) {
      const timeRange = testMode ? "2:00-4:00 PM" : "7:00-9:00 PM";
      throw new Error(`No available time slots found (tried ${timeRange})`);
    }
  }

  /**
   * Select a court from a list of acceptable courts
   * Tries each court in order until one is available
   */
  async selectCourt(courtNames: string[]): Promise<void> {
    // Wait for court details to load
    await this.page.waitForTimeout(500);

    for (const courtName of courtNames) {
      // Dynamic locator for the specific court
      const courtButton = this.page.getByRole("button", {
        name: courtName,
        exact: true,
      });

      // Check if this court is available
      const isVisible = await courtButton.isVisible().catch(() => false);
      if (!isVisible) {
        console.log(`⚠️ Court ${courtName} not visible, trying next`);
        continue;
      }

      const isDisabled = await courtButton.isDisabled().catch(() => true);
      if (isDisabled) {
        console.log(`⚠️ Court ${courtName} is disabled, trying next`);
        continue;
      }

      // Court is available, select it with resilient click
      try {
        const success = await this.resilientClick(courtButton, courtName);
        if (success) {
          console.log(`✅ Selected court: ${courtName}`);
          return;
        } else {
          console.log(`⚠️ Court ${courtName} became unavailable, trying next`);
        }
      } catch (err) {
        console.log(`❌ Failed to click court ${courtName}: ${err}`);
      }
    }

    throw new Error(
      `None of the specified courts are available: ${courtNames.join(", ")}`
    );
  }

  /**
   * Click the Next button to proceed
   */
  async clickNext(): Promise<void> {
    await this.nextButton.click();
    await this.page.waitForTimeout(500);
  }
}
