import { Page, Locator } from "playwright";

export interface CourtReserveOptions {
  email: string;
  password: string;
  testMode?: boolean;
}

export interface ReservationConfig {
  courtNames: string[]; // List of courts to try in order
  timeSlots: string[];
}

export interface ReservationSteps {
  page: Page;
  config: ReservationConfig;
  
  // Locators
  signInText: Locator;
  emailInput: Locator;
  passwordInput: Locator;
  signInButton: Locator;
  reserveCourtLink: Locator;
  availableCourtsText: Locator;
  confirmButton: Locator;
  confirmationText: Locator;
}

