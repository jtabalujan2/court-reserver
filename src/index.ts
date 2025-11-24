import dotenv from "dotenv";
import { BrowsercatClient } from "./browsercat-client.js";
import { CourtReserve } from "./court-reserve.js";

// Load .env.local for local development, but in CI the env vars are already set
dotenv.config({ path: ".env.local" });

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
  const courtName = process.env.COURT_NAME;
  const timeSlot = process.env.TIME_SLOT;

  if (!apiKey || !email || !password || !courtName || !timeSlot) {
    throw new Error("Missing required environment variables");
  }

  const bc = new BrowsercatClient(apiKey);

  try {
    console.log("Connecting to Browsercat...");
    const page = await bc.connect();

    console.log("Waiting until exactly 2:00 PM...");
    await waitUntil2PM();

    const reserve = new CourtReserve(page, {
      email,
      password,
      courtName,
      timeSlot,
    });

    console.log("Logging in...");
    await reserve.login();

    console.log("Navigating to reservation page...");
    await reserve.navigateToReservation();

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

