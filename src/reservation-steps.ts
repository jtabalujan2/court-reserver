import { Page } from "playwright";
import { ReservationConfig } from "./types.js";
import { getTargetDate, getDayName } from "./date-utils.js";

/**
 * Select the date from the calendar
 */
export async function selectDate(page: Page, testMode: boolean): Promise<void> {
  const targetDate = getTargetDate(testMode);
  const dayName = getDayName(targetDate);
  const dayNumber = targetDate.getDate().toString();

  console.log(`🎯 Looking for date: ${dayName} ${dayNumber}`);

  const dayButton = page.locator(
    `.day-container button:has(.day_name:text("${dayName}")):has(.day_number:text("${dayNumber}"))`
  );

  await dayButton.waitFor({ state: "visible" });
  await dayButton.click();
  console.log(`✅ Selected date: ${dayName} ${dayNumber}`);
}

/**
 * Select Pickleball as the sport type
 */
export async function selectSportType(page: Page): Promise<void> {
  const pickleballButton = page.locator(
    'button.ButtonOption:has-text("Pickleball")'
  );
  await pickleballButton.waitFor({ state: "visible" });

  // Check if already selected (has 'primary' class)
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
 * Try each time slot in order until one is available
 */
export async function selectTimeSlot(
  page: Page,
  config: ReservationConfig,
  testMode: boolean
): Promise<void> {
  // Wait for times to load
  await page.waitForTimeout(1000);

  for (const timeSlot of config.timeSlots) {
    console.log(`⏰ Trying time slot: ${timeSlot}`);

    // Look for button with exact text match
    const timeSlotButton = page.locator(
      `button.ButtonOption:has-text("${timeSlot}")`
    );

    // Check if this time slot is available
    const isVisible = await timeSlotButton.isVisible().catch(() => false);
    if (isVisible) {
      const isDisabled = await timeSlotButton.isDisabled().catch(() => true);
      if (!isDisabled) {
        await timeSlotButton.click();
        console.log(`✅ Selected time: ${timeSlot}`);
        return; // Success!
      } else {
        console.log(`   ⏭️  ${timeSlot} is disabled, trying next...`);
      }
    } else {
      console.log(`   ⏭️  ${timeSlot} not found, trying next...`);
    }
  }

  // If we get here, no slots were available
  const timeRange = testMode ? "2:00-4:00 PM" : "7:00-9:00 PM";
  throw new Error(`No available time slots found (tried ${timeRange})`);
}

/**
 * Select the specified court
 */
export async function selectCourt(
  page: Page,
  config: ReservationConfig
): Promise<void> {
  // Wait for court details to load
  await page.waitForTimeout(500);

  console.log(`🎾 Looking for ${config.courtName}`);
  const courtCard = page.locator(`.court-card:has-text("${config.courtName}")`);

  await courtCard.waitFor({ state: "visible", timeout: 5000 });
  await courtCard.click();
  console.log(`✅ Selected court: ${config.courtName}`);
}

/**
 * Login to the court reservation system
 */
export async function login(
  page: Page,
  email: string,
  password: string
): Promise<void> {
  await page.goto(
    "https://app.playbypoint.com/book/ipicklewhittiernarrows?skip_waivers=true"
  );

  const signInText = page.getByText("SIGN IN TO PLAYBYPOINT");
  await signInText.waitFor();

  const emailInput = page.locator("id=user_email");
  const passwordInput = page.locator("id=user_password");
  const signInButton = page.locator('input[type="submit"][value="Sign in"]');

  await emailInput.fill(email);
  await passwordInput.fill(password);

  await signInButton.click();
  await signInText.waitFor({ state: "hidden" });
}

/**
 * Navigate to the reservation page
 */
export async function navigateToReservation(page: Page): Promise<void> {
  const reserveCourtLink = page.getByText("Reserve Court");
  const availableCourtsText = page.getByText("Available Courts");

  await reserveCourtLink.click();
  await availableCourtsText.waitFor();
}

/**
 * Confirm the reservation
 */
export async function confirmReservation(page: Page): Promise<void> {
  const confirmButton = page.getByRole("button", {
    name: "Confirm Reservation",
  });
  const confirmationText = page.getByText("Reservation Confirmed");

  await confirmButton.click();
  await confirmationText.waitFor();
}
