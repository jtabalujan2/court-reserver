# Court Reservation Bot

Automates reserving a tennis court using:

- GitHub Actions (scheduled)
- Browsercat (instant browser, avoids delays)
- Playwright + clean class structure
- Exact 2:00 PM execution

## Setup

1. Clone repo
2. Run `npm install`
3. Create `.env.local` based on `.env.example`
4. Add GitHub secrets:

- `BROWSERCAT_API_KEY`
- `RESERVE_EMAIL`
- `RESERVE_PASSWORD`

**Note**: Court and time slots vary by mode:

**Production Mode** (default):
- Court: **Court 25**
- Time slots: **7-7:30pm, 7:30-8pm, 8-8:30pm, 8:30-9pm**

**Test Mode** (`TEST_MODE=true`):
- Court: **Court 1**
- Time slots: **2-2:30pm, 2:30-3pm, 3-3:30pm, 3:30-4pm**

The bot tries each time slot in order until one is available.

## Local Testing

### Option 1: Test with Local Browser (Recommended for Development)

Test your changes with a visible browser on your machine:

```bash
# 1. Create your local environment file
cp .env.example .env.local

# 2. Edit .env.local with your credentials (BROWSERCAT_API_KEY not needed for local testing)

# 3. Run with visible browser (best for testing)
npm run test:local:headed

# OR run headless (faster)
npm run test:local

# OR run with Playwright inspector (step through each action)
npm run test:local:debug
```

### Option 2: Test with Browsercat (Cloud Browser)

Test with the actual production Browsercat setup:

```bash
# 1. Make sure BROWSERCAT_API_KEY is set in .env.local

# 2. Run the script
npm run reserve

# OR build and run production version
npm run reserve:prod
```

## Development

This project uses TypeScript for type safety and better development experience.

### Project Structure

```
src/
├── index.ts                 # Main entry point, orchestrates the flow
├── court-reserve.ts         # Main reservation orchestrator class
├── reservation-steps.ts     # Individual step functions (login, select, confirm)
├── date-utils.ts           # Date calculation utilities
├── types.ts                # Shared TypeScript interfaces
└── browsercat-client.ts    # Browser connection management
```

**Why this structure?**
- **Separation of concerns**: Each file has a single, clear purpose
- **Easy to test**: Individual functions can be tested in isolation
- **Easy to debug**: Find the relevant code quickly
- **Easy to modify**: Change one part without affecting others

### Available Commands

**Testing Commands (use local Playwright):**
- `npm run test:local:headed` - 🎬 Watch the browser in action (slowMo enabled)
- `npm run test:local` - 🏃 Run headless locally (faster testing)
- `npm run test:local:debug` - 🐛 Step through with Playwright Inspector

**Production Commands (use Browsercat):**
- `npm run reserve` - Run with Browsercat (requires API key)
- `npm run build` - Compile TypeScript to JavaScript
- `npm run reserve:prod` - Build then run compiled version

## Date Selection Logic

The bot automatically selects reservation dates, courts, and times based on the mode:

### Production Mode (default)
- **Date**: Next Monday or Wednesday
  - If today is Sunday → next Monday
  - If today is Monday → next Wednesday  
  - If today is Tuesday → next Wednesday
  - If today is Wednesday → next Monday (5 days ahead)
  - If today is Thursday/Friday/Saturday → next Monday
- **Court**: Court 25
- **Times**: 7:00 PM, 7:30 PM, 8:00 PM, 8:30 PM (tries in order)

### Test Mode (`TEST_MODE=true`)
Set `TEST_MODE=true` in your `.env.local` for easier testing:
- **Date**: Same day next week (7 days from today)
  - Example: If today is Thursday → next Thursday
- **Court**: Court 1
- **Times**: 2:00 PM, 2:30 PM, 3:00 PM, 3:30 PM (tries in order)

This is useful for testing the entire flow without waiting for Monday/Wednesday or competing for prime evening slots.
