# Portfolio Infrastructure

AWS CDK infrastructure-as-code for the [Portfolio](https://github.com/hyoaru/hyoaru.github.io) website. Defines the cloud stack across two environments (Staging and Production) using AWS CDK with TypeScript. Provisions infrastructure for my portfolio.

## Architecture

Five CDK stacks are orchestrated via an `ApplicationStage`, each instantiated for Staging and Production environments. The stacks handle DNS, bootstrap resources, ACM certificates, CloudFront distribution, and CI/CD deployment roles.

Stack dependencies flow linearly: DNS → Bootstrap → WebCertificate → Web → Deployment.

### Platform Architecture

![Portfolio Infrastructure](docs/assets/Portfolio%20Infrastructure.png)

## Project Structure

```
portfolio-infrastructure/
├── bin/app.ts                          # CDK app entry point (Staging + Production)
├── lib/
│   ├── constants.ts                    # PARAMETER_BASE_PATH = "portfolio"
│   ├── stacks/
│   │   ├── dns.ts                      # Route 53 HostedZone
│   │   ├── bootstrap.ts                # S3 project bucket
│   │   ├── web-certificate.ts          # ACM certificate (us-east-1 for CloudFront)
│   │   ├── web.ts                      # CloudFront Distribution + S3 origin
│   │   └── deployment.ts              # GitHub OIDC deploy role
│   ├── constructs/                     # Reusable constructs
│   ├── configurations/                 # Configuration definitions
│   └── stages/
│       └── application.ts              # ApplicationStage (orchestrates all stacks)
├── docs/assets/                        # Architecture diagrams
├── .env.example                        # Required environment variables template
├── cdk.json                            # CDK app config and feature flags
└── package.json
```

## Environment Variables

| Variable                | Description                    |
| ----------------------- | ------------------------------ |
| `APEX_DOMAIN`           | Base domain for all subdomains |
| `STAGING_ACCOUNT_ID`    | AWS account ID for staging     |
| `PRODUCTION_ACCOUNT_ID` | AWS account ID for production  |
| `CDK_DEFAULT_REGION`    | AWS region (from CLI config)   |

## CI/CD

The `DeploymentStack` creates an IAM Role (`PortfolioGitHubDeployRole`) configured for GitHub Actions OIDC federation. It trusts `repo:hyoaru/hyoaru.github.io:environment:*` and grants permissions to:

- Upload/delete artifacts to S3 (`client/*` prefix)
- Invalidate CloudFront distributions
- Read SSM parameters under `/portfolio/*`

Deployment pipelines are defined in the sibling repository:

- [hyoaru.github.io](https://github.com/hyoaru/hyoaru.github.io) — frontend build → S3 → CloudFront

## SSM Parameters

All parameters use the base path `/portfolio/` and are written by CDK stacks:

| Parameter                                | Description                                                      |
| ---------------------------------------- | ---------------------------------------------------------------- |
| `/portfolio/client-artifact-s3-uri`      | S3 URI for client build artifact (`s3://{bucket}/client/latest`) |
| `/portfolio/client-artifact-s3-uri-base` | S3 URI base path for client artifacts (`s3://{bucket}/client`)   |
| `/portfolio/cloudfront-distribution-id`  | CloudFront Distribution ID                                       |
