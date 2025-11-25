import { chromium } from "playwright-core";
import chromiumPkg from "@sparticuz/chromium";
import { CourtReserve } from "./court-reserve.js";

/**
 * AWS Lambda handler for court reservation
 * Triggered by EventBridge on Mon/Wed at 1:59 PM PST (1 min buffer for cold start)
 */
export async function handler(event: any) {
  console.log("Lambda invoked:", JSON.stringify(event, null, 2));

  const email = process.env.RESERVE_EMAIL;
  const password = process.env.RESERVE_PASSWORD;
  const testMode = process.env.TEST_MODE === "true";

  if (!email || !password) {
    throw new Error(
      "Missing required environment variables: RESERVE_EMAIL, RESERVE_PASSWORD"
    );
  }

  let browser;
  
  try {
    console.log("🖥️  Launching optimized Chromium in Lambda...");
    
    // Use @sparticuz/chromium for optimized Lambda execution
    browser = await chromium.launch({
      args: chromiumPkg.args,
      executablePath: await chromiumPkg.executablePath(),
      headless: true,
    });
    
    const context = await browser.newContext({
      viewport: { width: 1280, height: 900 },
    });
    
    const page = await context.newPage();

    const reserve = new CourtReserve(page, {
      email,
      password,
      testMode,
    });

    console.log("Logging in...");
    await reserve.login();

    console.log("Waiting for reservation page...");
    await reserve.waitForReservationPage();

    console.log("Selecting court and time...");
    await reserve.selectCourtAndTime();

    console.log("Confirming reservation...");
    await reserve.confirmReservation();

    console.log("🎉 Court reserved successfully!");

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Court reserved successfully",
        testMode,
      }),
    };
  } catch (err) {
    console.error("❌ Error:", err);
    throw err;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

