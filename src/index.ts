import dotenv from "dotenv";
import { existsSync } from "fs";
import { BrowsercatClient } from "./browsercat-client.js";
import { CourtReserve } from "./court-reserve.js";

// Load .env.local for local development, but in CI the env vars are already set via GitHub Actions
if (existsSync(".env.local")) {
  dotenv.config({ path: ".env.local" });
} else if (existsSync(".env")) {
  dotenv.config({ path: ".env" });
}

// Wait until exactly 2:00:00 PM local time
async function waitUntil2PM(): Promise<void> {
  return new Promise((resolve) => {
    const check = () => {
      const now = new Date();

      // If already past 2:00 PM, run immediately
      if (
        now.getHours() > 14 ||
        (now.getHours() === 14 && now.getMinutes() > 0)
      ) {
        console.log("⚠️  Already past 2:00 PM. Running immediately.");
        return resolve();
      }

      const is2pm =
        now.getHours() === 14 &&
        now.getMinutes() === 0 &&
        now.getSeconds() === 0;

      if (is2pm) {
        console.log("🎯 It's exactly 2:00:00 PM. Starting reservation.");
        return resolve();
      }

      // Check every 250ms
      setTimeout(check, 250);
    };

    check();
  });
}

async function run(): Promise<void> {
  const apiKey = process.env.BROWSERCAT_API_KEY;
  const email = process.env.RESERVE_EMAIL;
  const password = process.env.RESERVE_PASSWORD;
  const local = process.env.PLAYWRIGHT_LOCAL === "true";
  const headed = process.env.HEADED === "true";

  // In local mode, API key is optional
  if (!local && !apiKey) {
    throw new Error("BROWSERCAT_API_KEY is required when not in local mode");
  }

  if (!email || !password) {
    throw new Error(
      "Missing required environment variables: RESERVE_EMAIL, RESERVE_PASSWORD"
    );
  }

  const bc = new BrowsercatClient({
    apiKey: apiKey || "",
    local,
    headed,
  });

  try {
    console.log("Connecting to Browsercat...");
    const page = await bc.connect();

    const testMode = process.env.TEST_MODE === "true";

    if (testMode) {
      console.log("⚡ TEST_MODE enabled - running immediately");
    } else {
      console.log("Waiting until exactly 2:00 PM...");
      await waitUntil2PM();
    }

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
  } catch (err) {
    console.error("❌ Error:", err);
    throw err;
  } finally {
    await bc.close();
  }
}

run();
