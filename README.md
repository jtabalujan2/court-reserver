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
- `COURT_NAME`
- `TIME_SLOT`

## Local Test

```bash
# 1. Create your local environment file
cp .env.example .env.local

# 2. Edit .env.local with your credentials

# 3. Run the script
node src/index.js
```
