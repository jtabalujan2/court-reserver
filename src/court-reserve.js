export class CourtReserve {
  constructor(page, opts) {
    this.page = page;

    this.email = opts.email;
    this.password = opts.password;
    this.courtName = opts.courtName;
    this.timeSlot = opts.timeSlot;
  }

  // LOGIN
  async login() {
    await this.page.goto("https://example-tennisclub.com/login");

    await this.page.fill("#email", this.email);
    await this.page.fill("#password", this.password);

    await this.page.click("button:has-text('Sign In')");
    await this.page.waitForNavigation({ waitUntil: "networkidle" });
  }

  // NAVIGATE
  async navigateToReservation() {
    await this.page.click("a:has-text('Reserve Court')");
    await this.page.waitForSelector("text=Available Courts");
  }

  // SELECT COURT + TIME
  async selectCourtAndTime() {
    await this.page.click(`.court-card:has-text("${this.courtName}")`);
    await this.page.click(`button:has-text("${this.timeSlot}")`);
  }

  // CONFIRM
  async confirmReservation() {
    await this.page.click("button:has-text('Confirm Reservation')");
    await this.page.waitForSelector("text=Reservation Confirmed");
  }
}
