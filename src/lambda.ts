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
    // Add extra args for iframe support and to avoid bot detection
    browser = await chromium.launch({
      args: [
        ...chromiumPkg.args,
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process',
        '--disable-blink-features=AutomationControlled',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
        '--window-size=1280,900',
      ],
      executablePath: await chromiumPkg.executablePath(),
      headless: true,
    });
    
    const context = await browser.newContext({
      viewport: { width: 1280, height: 900 },
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      locale: 'en-US',
      timezoneId: 'America/Los_Angeles',
      permissions: ['geolocation'],
      geolocation: { latitude: 34.0522, longitude: -118.2437 }, // Los Angeles coords
      extraHTTPHeaders: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
      },
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

