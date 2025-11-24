import { Page } from "playwright";
import { CourtReserveOptions, ReservationConfig } from "./types.js";
import { LoginPage } from "./pages/login-page.js";
import { ReservationPage } from "./pages/reservation-page.js";
import { ConfirmationPage } from "./pages/confirmation-page.js";

// Re-export types for convenience
export type { CourtReserveOptions } from "./types.js";

/**
 * Main orchestrator for court reservation automation
 * Coordinates multiple page objects to complete the booking flow
 */
export class CourtReserve {
  readonly page: Page;
  readonly email: string;
  readonly password: string;
  readonly testMode: boolean;
  readonly config: ReservationConfig;

  // Page Objects
  readonly loginPage: LoginPage;
  readonly reservationPage: ReservationPage;
  readonly confirmationPage: ConfirmationPage;

  constructor(page: Page, opts: CourtReserveOptions) {
    this.page = page;
    this.email = opts.email;
    this.password = opts.password;
    this.testMode = opts.testMode ?? false;

    // Initialize page objects
    this.loginPage = new LoginPage(page);
    this.reservationPage = new ReservationPage(page);
    this.confirmationPage = new ConfirmationPage(page);

    // Set court and time slots based on mode
    if (this.testMode) {
      this.config = {
        courtName: "PB Court 1",
        timeSlots: ["-2:30pm", ":30-3pm", "-3:30pm", ":30-4pm"],
      };
      console.log("🧪 Test mode: PB Court 1, afternoon times (2:00-4:00 PM)");
    } else {
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
    await this.loginPage.goto();
    await this.loginPage.login(this.email, this.password);
  }

  /**
   * Wait for the reservation page to load
   */
  async waitForReservationPage(): Promise<void> {
    await this.reservationPage.waitForPageLoad();
  }

  /**
   * Complete the entire court and time selection flow
   */
  async selectCourtAndTime(): Promise<void> {
    await this.reservationPage.selectDate(this.testMode);
    await this.reservationPage.selectSportType();
    await this.reservationPage.selectTimeSlot(this.config, this.testMode);
    await this.reservationPage.selectCourt(this.config.courtName);
    await this.reservationPage.clickNext();
  }

  /**
   * Confirm the reservation
   */
  async confirmReservation(): Promise<void> {
    await this.confirmationPage.completeBooking();
  }
}
