// AWS CDK Configuration for Court Reserver
// Total: ~90 lines (more concise than Terraform!)

import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as ecr from "aws-cdk-lib/aws-ecr";
import * as iam from "aws-cdk-lib/aws-iam";
import * as events from "aws-cdk-lib/aws-events";
import * as targets from "aws-cdk-lib/aws-events-targets";
import { Construct } from "constructs";

export class CourtReserverStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // ECR Repository
    const repository = new ecr.Repository(this, "CourtReserverRepo", {
      repositoryName: "court-reserver",
      imageScanOnPush: false,
      removalPolicy: cdk.RemovalPolicy.RETAIN, // Keep images on stack delete
    });

    // Lambda Function
    const lambdaFunction = new lambda.DockerImageFunction(
      this,
      "CourtReserverFunction",
      {
        functionName: "court-reserver",
        code: lambda.DockerImageCode.fromEcr(repository, {
          tagOrDigest: "latest",
        }),
        timeout: cdk.Duration.seconds(300),
        memorySize: 2048,
        environment: {
          PLAYWRIGHT_LOCAL: "true",
          // RESERVE_EMAIL and RESERVE_PASSWORD set via GitHub Actions
        },
      }
    );

    // EventBridge Schedule (Mon/Wed at 1:59 PM PST = 21:59 UTC)
    const rule = new events.Rule(this, "ScheduleRule", {
      ruleName: "court-reserver-schedule",
      schedule: events.Schedule.expression("cron(59 21 ? * MON,WED *)"),
    });

    rule.addTarget(new targets.LambdaFunction(lambdaFunction));

    // GitHub OIDC Provider
    const githubProvider = new iam.OpenIdConnectProvider(
      this,
      "GitHubProvider",
      {
        url: "https://token.actions.githubusercontent.com",
        clientIds: ["sts.amazonaws.com"],
        thumbprints: ["6938fd4d98bab03faadb97b34396831e3780aea1"],
      }
    );

    // IAM Role for GitHub Actions
    const githubActionsRole = new iam.Role(this, "GitHubActionsRole", {
      roleName: "github-actions-court-reserver",
      assumedBy: new iam.WebIdentityPrincipal(
        githubProvider.openIdConnectProviderArn,
        {
          StringEquals: {
            "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
          },
          StringLike: {
            "token.actions.githubusercontent.com:sub":
              "repo:jtabalujan2/court-reserver:*",
          },
        }
      ),
    });

    // Grant GitHub Actions permissions to deploy
    githubActionsRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          "ecr:GetAuthorizationToken",
          "ecr:BatchCheckLayerAvailability",
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchGetImage",
          "ecr:PutImage",
          "ecr:InitiateLayerUpload",
          "ecr:UploadLayerPart",
          "ecr:CompleteLayerUpload",
        ],
        resources: ["*"],
      })
    );

    githubActionsRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ["lambda:UpdateFunctionCode", "lambda:GetFunction"],
        resources: [lambdaFunction.functionArn],
      })
    );

    // Outputs
    new cdk.CfnOutput(this, "RepositoryUri", {
      value: repository.repositoryUri,
      description: "ECR Repository URI",
    });

    new cdk.CfnOutput(this, "FunctionArn", {
      value: lambdaFunction.functionArn,
      description: "Lambda Function ARN",
    });

    new cdk.CfnOutput(this, "GitHubRoleArn", {
      value: githubActionsRole.roleArn,
      description: "GitHub Actions Role ARN (add to GitHub secrets)",
    });
  }
}
