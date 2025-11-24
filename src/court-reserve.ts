import { Page } from "playwright";
import { CourtReserveOptions, ReservationConfig } from "./types.js";
import * as steps from "./reservation-steps.js";

// Re-export types for convenience
export type { CourtReserveOptions } from "./types.js";

/**
 * Main class for automating court reservations
 * Orchestrates the reservation flow using modular step functions
 */
export class CourtReserve {
  readonly page: Page;
  readonly email: string;
  readonly password: string;
  readonly testMode: boolean;
  readonly config: ReservationConfig;

  constructor(page: Page, opts: CourtReserveOptions) {
    this.page = page;
    this.email = opts.email;
    this.password = opts.password;
    this.testMode = opts.testMode ?? false;

    // Set court and time slots based on mode
    if (this.testMode) {
      // Test mode: easier times and court for testing
      this.config = {
        courtName: "PB Court 1",
        timeSlots: ["-2:30pm", ":30-3pm", "-3:30pm", ":30-4pm"],
      };
      console.log("🧪 Test mode: PB Court 1, afternoon times (2:00-4:00 PM)");
    } else {
      // Production mode: prime evening slots
      this.config = {
        courtName: "PB Court 25",
        timeSlots: ["-7:30pm", ":30-8pm", "-8:30pm", ":30-9pm"],
      };
      console.log("🚀 Production mode: PB Court 25, evening times (7:00-9:00 PM)");
    }
  }

  /**
   * Login to the court reservation system
   */
  async login(): Promise<void> {
    await steps.login(this.page, this.email, this.password);
  }

  /**
   * Navigate to the reservation page
   */
  async navigateToReservation(): Promise<void> {
    await steps.navigateToReservation(this.page);
  }

  /**
   * Complete the entire court and time selection flow
   */
  async selectCourtAndTime(): Promise<void> {
    await steps.selectDate(this.page, this.testMode);
    await steps.selectSportType(this.page);
    await steps.selectTimeSlot(this.page, this.config, this.testMode);
    await steps.selectCourt(this.page, this.config);
  }

  /**
   * Confirm the reservation
   */
  async confirmReservation(): Promise<void> {
    await steps.confirmReservation(this.page);
  }
}
