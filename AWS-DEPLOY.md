# AWS Lambda Deployment Guide

Simple step-by-step guide to deploy your court reserver to AWS Lambda.

## Prerequisites

1. **AWS Account** - Sign up at [aws.amazon.com](https://aws.amazon.com) (free tier)
2. **AWS CLI** - Install: `brew install awscli`
3. **Configure AWS CLI**:
   ```bash
   aws configure
   # Enter your AWS Access Key ID
   # Enter your AWS Secret Access Key
   # Region: us-west-2 (or your preferred region)
   # Output format: json
   ```
4. **Docker** - Make sure Docker is running

## Step 1: Build Your Code

```bash
npm run build
```

## Step 2: Create ECR Repository (Docker Image Storage)

```bash
# Set your AWS account ID
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
export AWS_REGION="us-west-2"

# Create repository
aws ecr create-repository \
  --repository-name court-reserver \
  --region $AWS_REGION
```

## Step 3: Build and Push Docker Image

```bash
# Login to ECR
aws ecr get-login-password --region $AWS_REGION | \
  docker login --username AWS --password-stdin \
  $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

# Build image
docker build -f Dockerfile.aws -t court-reserver:latest .

# Tag for ECR
docker tag court-reserver:latest \
  $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/court-reserver:latest

# Push to ECR
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/court-reserver:latest
```

## Step 4: Create IAM Role for Lambda

```bash
# Create role
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

# Attach basic execution policy
aws iam attach-role-policy \
  --role-name court-reserver-role \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole

# Get the role ARN (you'll need this)
aws iam get-role --role-name court-reserver-role --query 'Role.Arn' --output text
```

## Step 5: Create Lambda Function

```bash
# Replace YOUR_ROLE_ARN with the ARN from previous step
export ROLE_ARN="arn:aws:iam::$AWS_ACCOUNT_ID:role/court-reserver-role"
export IMAGE_URI="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/court-reserver:latest"

# Wait 10 seconds for IAM role to propagate
sleep 10

# Create function
aws lambda create-function \
  --function-name court-reserver \
  --package-type Image \
  --code ImageUri=$IMAGE_URI \
  --role $ROLE_ARN \
  --timeout 300 \
  --memory-size 2048 \
  --region $AWS_REGION
```

## Step 6: Set Environment Variables

```bash
aws lambda update-function-configuration \
  --function-name court-reserver \
  --environment "Variables={
    RESERVE_EMAIL=your-email@example.com,
    RESERVE_PASSWORD=yourpassword,
    PLAYWRIGHT_LOCAL=true
  }" \
  --region $AWS_REGION
```

**⚠️ Replace the email and password with your actual credentials!**

## Step 7: Create EventBridge Schedule

```bash
# Create rule for Mon/Wed at 1:59 PM PST (21:59 UTC)
aws events put-rule \
  --name court-reserver-schedule \
  --schedule-expression "cron(59 21 ? * MON,WED *)" \
  --state ENABLED \
  --region $AWS_REGION

# Get Lambda function ARN
export FUNCTION_ARN=$(aws lambda get-function \
  --function-name court-reserver \
  --region $AWS_REGION \
  --query 'Configuration.FunctionArn' \
  --output text)

# Give EventBridge permission to invoke Lambda
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

## ✅ Done!

Your Lambda function will now run every Monday and Wednesday at 1:59 PM PST. It waits until exactly 2:00 PM to execute the booking.

## Testing

### Manual Test
```bash
aws lambda invoke \
  --function-name court-reserver \
  --region $AWS_REGION \
  response.json

# Check the response
cat response.json
```

### View Logs
```bash
aws logs tail /aws/lambda/court-reserver --region $AWS_REGION --follow
```

## Updating the Function

When you make code changes:

```bash
# 1. Build
npm run build

# 2. Build & push new image
docker build -f Dockerfile.aws -t court-reserver:latest .
docker tag court-reserver:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/court-reserver:latest
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/court-reserver:latest

# 3. Update Lambda
aws lambda update-function-code \
  --function-name court-reserver \
  --image-uri $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/court-reserver:latest \
  --region $AWS_REGION
```

## Cost

- **Lambda**: FREE (well under 1M requests/month)
- **EventBridge**: FREE
- **ECR Storage**: ~$0.10/month
- **Total**: ~$0.10/month

## Cleanup (if needed)

```bash
# Delete Lambda function
aws lambda delete-function --function-name court-reserver --region $AWS_REGION

# Delete EventBridge rule
aws events remove-targets --rule court-reserver-schedule --ids "1" --region $AWS_REGION
aws events delete-rule --name court-reserver-schedule --region $AWS_REGION

# Delete IAM role
aws iam detach-role-policy --role-name court-reserver-role --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
aws iam delete-role --role-name court-reserver-role

# Delete ECR repository
aws ecr delete-repository --repository-name court-reserver --force --region $AWS_REGION
```

