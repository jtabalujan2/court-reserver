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

    // Use role-based selector (more reliable)
    const timeSlotButton = page.getByRole("button", { name: timeSlot });

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

  // Use role-based selector for more reliability
  const courtButton = page.getByRole("button", { name: config.courtName });

  await courtButton.waitFor({ state: "visible", timeout: 5000 });
  await courtButton.click();
  console.log(`✅ Selected court: ${config.courtName}`);

  // Click Next button to proceed
  console.log("⏭️  Clicking Next...");
  await page.getByRole("button", { name: "Next" }).click();
  await page.waitForTimeout(500);
}

/**
 * Login to the court reservation system
 * Note: Login form is inside an iframe
 */
export async function login(
  page: Page,
  email: string,
  password: string
): Promise<void> {
  await page.goto(
    "https://app.playbypoint.com/book/ipicklewhittiernarrows?skip_waivers=true"
  );

  console.log("⏳ Waiting for login iframe...");

  // The login form is inside an iframe
  const iframe = page
    .locator("div")
    .filter({ hasText: "Enter your account ServicesServices" })
    .locator("iframe")
    .contentFrame();

  // Wait for iframe to load
  await iframe.getByRole("textbox", { name: "Email" }).waitFor();

  // Fill in credentials
  await iframe.getByRole("textbox", { name: "Email" }).fill(email);
  await iframe.getByRole("textbox", { name: "Password" }).fill(password);

  // Click sign in
  await iframe.getByRole("button", { name: "Sign in" }).click();

  console.log("✅ Logged in successfully");

  // Wait for navigation to complete
  await page.waitForLoadState("networkidle");
}

/**
 * Wait for the reservation page to load after login
 */
export async function waitForReservationPage(page: Page): Promise<void> {
  console.log("⏳ Waiting for reservation page to load...");
  // Wait for the date selector heading to appear
  await page.getByText("Select date and time").waitFor({ state: "visible" });
  console.log("✅ Reservation page loaded");
}

/**
 * Confirm the reservation
 * Handles the Add Users step and final booking confirmation
 */
export async function confirmReservation(page: Page): Promise<void> {
  // Skip adding additional users (or add them if needed)
  console.log("👥 Handling Add Users step...");

  // Click Next to skip adding users (or click Add Users if you want to add someone)
  await page.getByRole("button", { name: "Next" }).click();
  await page.waitForTimeout(500);

  // Click Book button
  console.log("📝 Clicking Book...");
  await page.getByRole("button", { name: "Book" }).click();

  // Confirm the booking (Yes button)
  console.log("✅ Confirming booking...");
  await page.getByRole("button", { name: "Yes" }).click();

  console.log("🎉 Reservation confirmed!");
}
