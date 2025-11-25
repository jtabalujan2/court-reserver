# AWS Lambda Setup with GitHub Actions CI/CD

Simple setup: Do the initial deployment manually once, then every code push auto-deploys via GitHub Actions.

## One-Time Manual Setup

### Step 1: Create ECR Repository & IAM Role

Run these commands once to create the infrastructure:

```bash
# Set variables
export AWS_REGION="us-west-2"
export GITHUB_REPO="jtabalujan2/court-reserver"  # Change to your repo

# Get your AWS account ID
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo "AWS Account: $AWS_ACCOUNT_ID"

# Create ECR repository
aws ecr create-repository \
  --repository-name court-reserver \
  --region $AWS_REGION

# Create IAM role for Lambda
aws iam create-role \
  --role-name court-reserver-role \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": {"Service": "lambda.amazonaws.com"},
      "Action": "sts:AssumeRole"
    }]
  }'

# Attach execution policy
aws iam attach-role-policy \
  --role-name court-reserver-role \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole

# Wait for IAM to propagate
sleep 10
```

### Step 2: Build and Deploy Initial Lambda Function

```bash
# Build code
npm run build

# Login to ECR
aws ecr get-login-password --region $AWS_REGION | \
  docker login --username AWS --password-stdin \
  $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

# Build and push Docker image
docker build -f Dockerfile.aws -t court-reserver:latest .
docker tag court-reserver:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/court-reserver:latest
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/court-reserver:latest

# Create Lambda function
export ROLE_ARN="arn:aws:iam::$AWS_ACCOUNT_ID:role/court-reserver-role"
export IMAGE_URI="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/court-reserver:latest"

aws lambda create-function \
  --function-name court-reserver \
  --package-type Image \
  --code ImageUri=$IMAGE_URI \
  --role $ROLE_ARN \
  --timeout 300 \
  --memory-size 2048 \
  --region $AWS_REGION

# Set environment variables (replace with your credentials!)
aws lambda update-function-configuration \
  --function-name court-reserver \
  --environment "Variables={
    RESERVE_EMAIL=your-email@example.com,
    RESERVE_PASSWORD=yourpassword,
    PLAYWRIGHT_LOCAL=true
  }" \
  --region $AWS_REGION
```

### Step 3: Create EventBridge Schedule

```bash
# Create rule for Mon/Wed at 1:59 PM PST
aws events put-rule \
  --name court-reserver-schedule \
  --schedule-expression "cron(59 21 ? * MON,WED *)" \
  --state ENABLED \
  --region $AWS_REGION

# Get Lambda ARN
export FUNCTION_ARN=$(aws lambda get-function \
  --function-name court-reserver \
  --region $AWS_REGION \
  --query 'Configuration.FunctionArn' \
  --output text)

# Give EventBridge permission
aws lambda add-permission \
  --function-name court-reserver \
  --statement-id court-reserver-schedule \
  --action 'lambda:InvokeFunction' \
  --principal events.amazonaws.com \
  --source-arn arn:aws:events:$AWS_REGION:$AWS_ACCOUNT_ID:rule/court-reserver-schedule \
  --region $AWS_REGION

# Add Lambda as target
aws events put-targets \
  --rule court-reserver-schedule \
  --targets "Id"="1","Arn"="$FUNCTION_ARN" \
  --region $AWS_REGION
```

---

## GitHub Actions Auto-Deploy Setup

Now set up automatic deployments on every code push.

### Step 1: Create GitHub OIDC Provider in AWS

```bash
# Create OIDC provider for GitHub
aws iam create-open-id-connect-provider \
  --url https://token.actions.githubusercontent.com \
  --client-id-list sts.amazonaws.com \
  --thumbprint-list 6938fd4d98bab03faadb97b34396831e3780aea1
```

### Step 2: Create IAM Role for GitHub Actions

```bash
# Create trust policy for GitHub Actions
cat > github-trust-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::$AWS_ACCOUNT_ID:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:$GITHUB_REPO:*"
        }
      }
    }
  ]
}
EOF

# Create role for GitHub Actions
aws iam create-role \
  --role-name github-actions-court-reserver \
  --assume-role-policy-document file://github-trust-policy.json

# Get the role ARN
export GITHUB_ROLE_ARN=$(aws iam get-role \
  --role-name github-actions-court-reserver \
  --query 'Role.Arn' \
  --output text)

echo "GitHub Actions Role ARN: $GITHUB_ROLE_ARN"
```

### Step 3: Attach Permissions to GitHub Actions Role

```bash
# Create inline policy for deployment permissions
cat > github-deploy-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ecr:GetAuthorizationToken",
        "ecr:BatchCheckLayerAvailability",
        "ecr:GetDownloadUrlForLayer",
        "ecr:BatchGetImage",
        "ecr:PutImage",
        "ecr:InitiateLayerUpload",
        "ecr:UploadLayerPart",
        "ecr:CompleteLayerUpload"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "lambda:UpdateFunctionCode",
        "lambda:GetFunction"
      ],
      "Resource": "arn:aws:lambda:$AWS_REGION:$AWS_ACCOUNT_ID:function:court-reserver"
    }
  ]
}
EOF

# Attach policy
aws iam put-role-policy \
  --role-name github-actions-court-reserver \
  --policy-name DeployLambda \
  --policy-document file://github-deploy-policy.json

# Cleanup temp files
rm github-trust-policy.json github-deploy-policy.json
```

### Step 4: Add Secret to GitHub

```bash
# Print the role ARN to add to GitHub secrets
echo ""
echo "✅ Setup complete!"
echo ""
echo "Add this as AWS_ROLE_ARN secret in GitHub:"
echo "$GITHUB_ROLE_ARN"
echo ""
echo "Go to: https://github.com/$GITHUB_REPO/settings/secrets/actions/new"
```

1. Go to your GitHub repo → **Settings** → **Secrets and variables** → **Actions**
2. Click **"New repository secret"**
3. Name: `AWS_ROLE_ARN`
4. Value: (paste the ARN from above)
5. Click **"Add secret"**

---

## ✅ Done!

Now every time you push code to `master` branch:

- GitHub Actions builds TypeScript
- Builds Docker image
- Pushes to ECR
- Updates Lambda function
- Automatic deployment! 🎉

### Test the Workflow

```bash
# Make a small change and push
git commit --allow-empty -m "Test deploy workflow"
git push
```

Go to your repo → **Actions** tab to watch the deployment!

### Manual Deploy

You can also trigger deployment manually:

1. Go to **Actions** tab
2. Select **"Deploy to AWS Lambda"**
3. Click **"Run workflow"**

### View Logs

```bash
aws logs tail /aws/lambda/court-reserver --region $AWS_REGION --follow
```
