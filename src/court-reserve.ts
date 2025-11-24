import { Page, Locator } from "playwright";

export interface CourtReserveOptions {
  email: string;
  password: string;
  courtName: string;
  timeSlot: string;
}

export class CourtReserve {
  readonly page: Page;
  readonly email: string;
  readonly password: string;
  readonly courtName: string;
  readonly timeSlot: string;

  // Login page locators
  readonly signInText: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly signInButton: Locator;

  // Navigation locators
  readonly reserveCourtLink: Locator;
  readonly availableCourtsText: Locator;

  // Court selection locators
  readonly courtCard: Locator;
  readonly timeSlotButton: Locator;

  // Confirmation locators
  readonly confirmButton: Locator;
  readonly confirmationText: Locator;

  constructor(page: Page, opts: CourtReserveOptions) {
    this.page = page;

    // Configuration
    this.email = opts.email;
    this.password = opts.password;
    this.courtName = opts.courtName;
    this.timeSlot = opts.timeSlot;

    // Login page locators
    this.signInText = page.getByText("SIGN IN TO PLAYBYPOINT");
    this.emailInput = page.locator("id=user_email");
    this.passwordInput = page.locator("id=user_password");
    this.signInButton = page.locator('input[type="submit"][value="Sign in"]');

    // Navigation locators
    this.reserveCourtLink = page.getByText("Reserve Court");
    this.availableCourtsText = page.getByText("Available Courts");

    // Court selection locators (dynamic based on config)
    this.courtCard = page.locator(`.court-card:has-text("${this.courtName}")`);
    this.timeSlotButton = page.getByRole("button", { name: this.timeSlot });

    // Confirmation locators
    this.confirmButton = page.getByRole("button", {
      name: "Confirm Reservation",
    });
    this.confirmationText = page.getByText("Reservation Confirmed");
  }

  async login(): Promise<void> {
    await this.page.goto(
      "https://app.playbypoint.com/book/ipicklewhittiernarrows?skip_waivers=true"
    );

    await this.signInText.waitFor();

    await this.emailInput.fill(this.email);
    await this.passwordInput.fill(this.password);

    await this.signInButton.click();
    await this.signInText.waitFor({ state: "hidden" });
  }

  async navigateToReservation(): Promise<void> {
    await this.reserveCourtLink.click();
    await this.availableCourtsText.waitFor();
  }

  async selectCourtAndTime(): Promise<void> {
    await this.courtCard.click();
    await this.timeSlotButton.click();
  }

  async confirmReservation(): Promise<void> {
    await this.confirmButton.click();
    await this.confirmationText.waitFor();
  }
}

