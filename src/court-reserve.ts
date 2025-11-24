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
        timeSlots: ["2-2:30pm", "2:30-3pm", "3-3:30pm", "3:30-4pm"],
      };
    } else {
      this.config = {
        courtName: "PB Court 25",
        timeSlots: ["7-7:30pm", "7:30-8pm", "8-8:30pm", "8:30-9pm"],
      };
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
   * In test mode, cancels at the end instead of confirming
   */
  async confirmReservation(): Promise<void> {
    await this.confirmationPage.completeBooking(this.testMode);
  }
}
