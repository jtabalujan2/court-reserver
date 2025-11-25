# Court Reservation Bot

Automates reserving a tennis court using:

- Playwright (browser automation)
- Clean Page Object Model architecture
- Exact 2:00 PM execution
- AWS Lambda + EventBridge (recommended), Render.com, or GitHub Actions

## 🚀 Production Deployment (Recommended: AWS Lambda with CI/CD)

AWS Lambda + EventBridge provides **enterprise-grade reliability, precise scheduling, and is completely FREE** for this usage.

### Automated Deployment with GitHub Actions

📖 **[Follow the AWS Setup Guide](./AWS-SETUP.md)** - One-time setup (~10 minutes)

After initial setup, **every code push auto-deploys** via GitHub Actions:
1. Run setup commands once (creates Lambda, ECR, IAM roles)
2. Configure GitHub Actions secrets
3. Push code → Automatic deployment! 🎉

**What gets automated:**
- TypeScript build
- Docker image build & push to ECR
- Lambda function updates
- Zero manual deployment after setup

### Why AWS Lambda?

✅ **100% Free** - 1M requests/month free tier (you use ~8/month)  
✅ **Precise scheduling** - EventBridge is rock-solid (no delays like GitHub Actions)  
✅ **Reliable** - Enterprise-grade infrastructure  
✅ **Optimized** - Uses @sparticuz/chromium for fast Lambda execution  
✅ **1-minute buffer** - Starts at 1:59 PM, executes at exactly 2:00 PM

### Cost

- **Lambda**: $0 (well under free tier)
- **EventBridge**: $0 (free tier covers it)
- **ECR storage**: ~$0.10/month
- **Total**: ~$0.10/month

---

## Alternative: Render.com

Render.com is simpler if you don't want to deal with AWS.

## Alternative: GitHub Actions (Less Reliable)

GitHub Actions is still available but **not recommended** for production due to scheduling delays (5-20 minutes).

**Why GitHub Actions has delays:**
- Scheduled workflows run on shared infrastructure
- High load times (start of every hour) cause delays
- No guarantee of exact execution time

**If you still want to use GitHub Actions:**

1. Set secrets in GitHub repository settings:
   - `RESERVE_EMAIL`
   - `RESERVE_PASSWORD`

2. Workflows will run automatically:
   - **reserve.yml**: Mon/Wed at ~1:40 PM PST (waits until 2:00 PM)
   - **test-reserve.yml**: Manual trigger only

**⚠️ Important:** Due to GitHub's delays, you may miss the 2:00 PM booking window. Use Render.com for reliable timing.

---

## Local Development Setup

1. Clone repo
2. Run `npm install`
3. Create `.env.local` based on `.env.example`
4. Set your credentials:
   - `RESERVE_EMAIL`
   - `RESERVE_PASSWORD`

## GitHub Workflows

### Production Workflow
**File**: `.github/workflows/reserve.yml`
- Runs automatically Monday & Wednesday at 2:00 PM PST
- Books Court 25 at 7:00-9:00 PM
- Can also be triggered manually via GitHub Actions UI

### Test Workflow  
**File**: `.github/workflows/test-reserve.yml`
- **Manual trigger only** (workflow_dispatch)
- Runs in TEST_MODE (Court 1, afternoon slots, cancels at the end)
- Perfect for verifying the flow works end-to-end without making actual bookings

**To run the test workflow:**
1. Go to **Actions** tab in GitHub
2. Select **"Test Court Reservation"** workflow
3. Click **"Run workflow"**
4. Optionally add a reason for the test run
5. Watch it execute in test mode (will cancel at the end)

**Note**: Court and time slots vary by mode:

**Production Mode** (default):
- Courts: **PB Court 24, PB Court 25** (tries in order)
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
- **Date**: 6 days from today (avoids 7-day countdown period)
  - Example: If today is Thursday → next Wednesday
- **Court**: Court 1
- **Times**: 2:00 PM, 2:30 PM, 3:00 PM, 3:30 PM (tries in order)
- **Cancels at end**: Won't make actual reservation

This is useful for testing the entire flow without waiting for Monday/Wednesday or competing for prime evening slots.
