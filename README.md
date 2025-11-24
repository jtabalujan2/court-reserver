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
- Court: **PB Court 25**
- Time slots: **7-7:30pm, 7:30-8pm, 8-8:30pm, 8:30-9pm**

**Test Mode** (`TEST_MODE=true`):
- Court: **PB Court 1**
- Time slots: **2-2:30pm, 2:30-3pm, 3-3:30pm, 3:30-4pm**

The bot tries each time slot in order until one is available.

## Local Testing

### Quick Start - Test Locally

```bash
# 1. Create your local environment file
cp .env.example .env.local

# 2. Edit .env.local with your credentials
# (BROWSERCAT_API_KEY not needed for local testing)

# 3. Run in development mode (visible browser, slower actions)
npm run dev

# OR use Playwright Inspector (step through, pause, inspect elements)
npm run debug
```

### Production - Test with Browsercat

```bash
# Make sure BROWSERCAT_API_KEY is set in .env.local
npm run reserve
```

## Development

This project uses TypeScript for type safety and better development experience.

### Project Structure

```
src/
├── index.ts                      # Main entry point
├── court-reserve.ts              # Main orchestrator class
├── pages/
│   ├── login-page.ts            # Login page object
│   ├── reservation-page.ts      # Date/time/court selection page
│   └── confirmation-page.ts     # Booking confirmation page
├── date-utils.ts                # Date calculation utilities
├── types.ts                     # Shared TypeScript interfaces
└── browsercat-client.ts         # Browser connection management
```

**Multi-Page Object Model Pattern:**
- **Separation by page**: Each page class represents a distinct part of the UI
- **`LoginPage`**: Handles authentication (iframe-based login)
- **`ReservationPage`**: Handles date, sport, time, and court selection
- **`ConfirmationPage`**: Handles add users and final booking steps
- **`CourtReserve`**: Thin orchestrator that coordinates page objects
- **Single Responsibility**: Each page class has one clear purpose
- **Easy to maintain**: Changes to one page don't affect others

### Available Commands

**Development:**
- `npm run dev` - 🎬 Watch browser in action (visible, slow motion)
- `npm run debug` - 🐛 Playwright Inspector (step through, pause, inspect)

**Production:**
- `npm run reserve` - Run with Browsercat (requires API key)
- `npm run build` - Compile TypeScript to JavaScript
- `npm run reserve:prod` - Build then run compiled version

### Debugging Tools

**Playwright Inspector (`npm run debug`):**
- ▶️ Step through each action one at a time
- ⏸️ Pause and inspect the page state
- 🎯 **Pick Locator** button - click elements to get their locators
- 📝 See the code execution in real-time

**Codegen - Record Actions (`npm run codegen`):**
- Opens browser + recorder
- Click around the site normally (login, select court, etc.)
- Playwright **generates the code** for you automatically
- Shows you the **exact locators** that work
- Copy/paste the generated code into your project

**How to use codegen:**
```bash
npm run codegen

# Then in the browser:
# 1. Fill in email/password and click sign in
# 2. Click "Reserve Court"
# 3. Select date, sport, time, court
# 4. Copy the generated locators from the Inspector
```

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
