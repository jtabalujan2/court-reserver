# Court Reservation Bot

Automates reserving pickleball courts using:
- **AWS Lambda** + EventBridge for reliable scheduling
- **Playwright** for browser automation
- **@sparticuz/chromium** for optimized Lambda performance
- **GitHub Actions** for CI/CD auto-deployment
- **Page Object Model** for clean, maintainable code

## 🚀 Production Setup

### Current Deployment

✅ **Already deployed to AWS Lambda!**

- **Function**: `court-reserver`
- **Schedule**: Mon/Wed at 1:59 PM PST (waits until 2:00 PM to execute)
- **Courts**: Court 24-25 at 7:00-9:00 PM (2-hour blocks)
- **Auto-deploy**: Every code push updates Lambda automatically

### 💰 Cost Analysis

**Completely FREE!** 🎉

Based on actual execution metrics:
- **Execution time**: ~30 seconds per run
- **Memory used**: 814 MB (of 2048 MB allocated)
- **Runs per month**: 8 (2 per week × 4 weeks)
- **Total compute**: 64 GB-seconds × 8 = 512 GB-seconds/month

AWS Lambda Free Tier (always free):
- ✅ 1M requests/month (we use 8)
- ✅ 400,000 GB-seconds/month (we use 512)

**Result**: Well within free tier limits. Zero cost! 💵

Even if you exceeded free tier:
- Cost per execution: ~$0.001 (0.1 cent)
- Monthly cost: ~$0.008 (less than 1 cent)

### GitHub Secrets Required

Add these at: https://github.com/jtabalujan2/court-reserver/settings/secrets/actions

| Secret | Value |
|--------|-------|
| `AWS_ROLE_ARN` | `arn:aws:iam::340706125656:role/github-actions-court-reserver` |
| `RESERVE_EMAIL` | Your email for the court booking site |
| `RESERVE_PASSWORD` | Your password for the court booking site |

### Update Lambda Environment Variables

After adding GitHub secrets, update Lambda with your credentials:

```bash
aws lambda update-function-configuration \
  --function-name court-reserver \
  --environment "Variables={
    PLAYWRIGHT_LOCAL=true,
    RESERVE_EMAIL=your-email@example.com,
    RESERVE_PASSWORD=your-password
  }" \
  --region us-west-2
```

### Manual Testing

#### Option 1: GitHub Actions (Easiest!)

Go to: https://github.com/jtabalujan2/court-reserver/actions/workflows/test-lambda.yml

1. Click "Run workflow"
2. Choose test mode (default: on - will cancel reservation)
3. Click green "Run workflow" button
4. Watch the logs in real-time!

#### Option 2: AWS CLI

Test the Lambda function directly:

```bash
# Invoke manually
aws lambda invoke \
  --function-name court-reserver \
  --region us-west-2 \
  response.json

# View response
cat response.json

# View logs
aws logs tail /aws/lambda/court-reserver --region us-west-2 --follow
```

---

## 💻 Local Development

### Setup

```bash
# Install dependencies
npm install

# Create local env file
cp .env.example .env.local

# Edit .env.local with your credentials
# RESERVE_EMAIL=your-email@example.com
# RESERVE_PASSWORD=yourpassword
```

### Local Testing Commands

```bash
# Test locally (visible browser, test mode - cancels at end)
npm run dev

# Debug with Playwright Inspector
npm run debug

# Generate locators with Codegen
npm run codegen
```

### Test vs Production Mode

**Test Mode** (`TEST_MODE=true`):
- Courts: 1-5 (tries in order)
- Time: 2:00-4:00 PM
- Date: 6 days ahead
- **Cancels reservation at the end**

**Production Mode** (default):
- Courts: 24-25 (tries in order)
- Time: 7:00-9:00 PM
- Date: Next Monday or Wednesday
- **Confirms reservation**

---

## 📂 Project Structure

```
court-reserver/
├── src/
│   ├── pages/              # Page Object Model
│   │   ├── login-page.ts
│   │   ├── reservation-page.ts
│   │   └── confirmation-page.ts
│   ├── court-reserve.ts    # Main orchestrator
│   ├── date-utils.ts       # Date calculation logic
│   ├── types.ts            # TypeScript interfaces
│   ├── lambda.ts           # AWS Lambda handler
│   ├── index.ts            # Local development entry
│   └── browsercat-client.ts # Browser launcher wrapper
├── .github/workflows/
│   └── deploy-lambda.yml   # CI/CD auto-deployment
├── Dockerfile.aws          # Lambda container image
├── tsconfig.json           # TypeScript configuration
└── package.json            # Dependencies & scripts
```

---

## 🔄 CI/CD Workflow

Every push to `master` triggers automatic deployment:

1. **Build TypeScript** → Compile to `dist/`
2. **Build Docker image** → Lambda container with Chromium
3. **Push to ECR** → AWS container registry
4. **Update Lambda** → Deploy new code

View deployments: https://github.com/jtabalujan2/court-reserver/actions

---

## 💰 Cost Breakdown

| Service | Cost |
|---------|------|
| Lambda execution | **FREE** (~8 invocations/month, 1M free tier) |
| EventBridge scheduling | **FREE** |
| ECR storage | **~$0.10/month** (single Docker image) |
| **Total** | **~$0.10/month** |

---

## 🛠️ Development Commands

```bash
# Build TypeScript
npm run build

# Run locally (test mode, visible browser)
npm run dev

# Debug with Playwright Inspector
npm run debug

# Generate locators
npm run codegen

# Run production mode locally
npm run reserve
```

---

## 📝 Notes

### Date Selection Logic

**Production**: Books courts for the **next Monday or Wednesday**
- If today is Mon: Books next Mon (7 days ahead)
- If today is Tue-Sun: Books next Mon
- If today is Wed: Books next Wed (7 days ahead)  
- If today is Thu-Tue: Books next Wed

**Test Mode**: Books **6 days ahead** (avoids countdown period)

### Court Selection

The bot tries courts in priority order until one is available:
- **Production**: Courts 24 → 25
- **Test**: Courts 1 → 2 → 3 → 4 → 5

If none are available, the script fails with an error.

### Time Slots

Always books **2-hour blocks** (4 consecutive 30-minute slots):
- **Production**: 7:00-9:00 PM
- **Test**: 2:00-4:00 PM

---

## 🐛 Troubleshooting

**Lambda not executing?**
- Check EventBridge rule is enabled: `aws events describe-rule --name court-reserver-schedule --region us-west-2`
- Check Lambda logs: `aws logs tail /aws/lambda/court-reserver --region us-west-2 --follow`

**Deployment failing?**
- Verify GitHub secrets are set correctly
- Check GitHub Actions logs: https://github.com/jtabalujan2/court-reserver/actions

**Local testing not working?**
- Ensure `.env.local` exists with correct credentials
- Run `npm install` to ensure dependencies are installed
- Check Playwright is installed: `npx playwright install chromium`

---

## 📚 Tech Stack

- **TypeScript** - Type-safe code
- **Playwright** - Browser automation
- **AWS Lambda** - Serverless compute
- **@sparticuz/chromium** - Lambda-optimized browser
- **EventBridge** - Scheduled triggers
- **GitHub Actions** - CI/CD pipeline
- **Docker** - Container packaging
- **ECR** - Container registry

---

## 🤝 Contributing

This is a personal project, but feel free to fork and adapt for your own court reservation needs!

---

## 📄 License

MIT
