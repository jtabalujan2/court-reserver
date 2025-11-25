# Terraform Configuration for Court Reserver
# Total: ~120 lines

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

variable "aws_region" {
  default = "us-west-2"
}

variable "github_repo" {
  default = "jtabalujan2/court-reserver"
}

# ECR Repository
resource "aws_ecr_repository" "court_reserver" {
  name                 = "court-reserver"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = false
  }
}

# IAM Role for Lambda
resource "aws_iam_role" "lambda_role" {
  name = "court-reserver-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_basic" {
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
  role       = aws_iam_role.lambda_role.name
}

# Lambda Function
resource "aws_lambda_function" "court_reserver" {
  function_name = "court-reserver"
  role          = aws_iam_role.lambda_role.arn
  package_type  = "Image"
  image_uri     = "${aws_ecr_repository.court_reserver.repository_url}:latest"
  timeout       = 300
  memory_size   = 2048

  environment {
    variables = {
      PLAYWRIGHT_LOCAL = "true"
      # RESERVE_EMAIL and RESERVE_PASSWORD set via GitHub Actions
    }
  }

  depends_on = [aws_iam_role_policy_attachment.lambda_basic]
}

# EventBridge Rule (Mon/Wed at 1:59 PM PST)
resource "aws_cloudwatch_event_rule" "schedule" {
  name                = "court-reserver-schedule"
  description         = "Run court reserver Mon/Wed at 1:59pm PST"
  schedule_expression = "cron(59 21 ? * MON,WED *)"
}

resource "aws_cloudwatch_event_target" "lambda" {
  rule      = aws_cloudwatch_event_rule.schedule.name
  target_id = "court-reserver-lambda"
  arn       = aws_lambda_function.court_reserver.arn
}

resource "aws_lambda_permission" "allow_eventbridge" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.court_reserver.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.schedule.arn
}

# GitHub OIDC Provider
resource "aws_iam_openid_connect_provider" "github" {
  url = "https://token.actions.githubusercontent.com"

  client_id_list = [
    "sts.amazonaws.com"
  ]

  thumbprint_list = [
    "6938fd4d98bab03faadb97b34396831e3780aea1"
  ]
}

# IAM Role for GitHub Actions
resource "aws_iam_role" "github_actions" {
  name = "github-actions-court-reserver"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Federated = aws_iam_openid_connect_provider.github.arn
      }
      Action = "sts:AssumeRoleWithWebIdentity"
      Condition = {
        StringEquals = {
          "token.actions.githubusercontent.com:aud" = "sts.amazonaws.com"
        }
        StringLike = {
          "token.actions.githubusercontent.com:sub" = "repo:${var.github_repo}:*"
        }
      }
    }]
  })
}

# Policy for GitHub Actions to deploy
resource "aws_iam_role_policy" "github_actions_deploy" {
  name = "deploy-lambda"
  role = aws_iam_role.github_actions.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ecr:GetAuthorizationToken",
          "ecr:BatchCheckLayerAvailability",
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchGetImage",
          "ecr:PutImage",
          "ecr:InitiateLayerUpload",
          "ecr:UploadLayerPart",
          "ecr:CompleteLayerUpload"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "lambda:UpdateFunctionCode",
          "lambda:GetFunction"
        ]
        Resource = aws_lambda_function.court_reserver.arn
      }
    ]
  })
}

# Outputs
output "ecr_repository_url" {
  value = aws_ecr_repository.court_reserver.repository_url
}

output "lambda_function_arn" {
  value = aws_lambda_function.court_reserver.arn
}

output "github_actions_role_arn" {
  value = aws_iam_role.github_actions.arn
}

