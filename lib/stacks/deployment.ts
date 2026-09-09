import {
  aws_cloudfront as cloudfront,
  aws_iam as iam,
  aws_s3 as s3,
} from "aws-cdk-lib";
import * as cdk from "aws-cdk-lib/core";
import { Construct } from "constructs";
import { PARAMETER_BASE_PATH } from "../constants";

interface DeploymentStackProps extends cdk.StackProps {
  projectBucket: s3.Bucket;
  cloudfrontDistribution: cloudfront.Distribution;
}

export class DeploymentStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: DeploymentStackProps) {
    super(scope, id, props);

    const githubOidcProviderArn = cdk.Fn.importValue("GithubOidcProviderArn");

    const deployRole = new iam.Role(this, "GitHubDeployRole", {
      roleName: "PortfolioGitHubDeployRole",

      assumedBy: new iam.FederatedPrincipal(
        githubOidcProviderArn,
        {
          StringEquals: {
            "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
          },
          StringLike: {
            "token.actions.githubusercontent.com:sub": [
              "repo:hyoaru@*/hyoaru.github.io@*:environment:*",
            ],
          },
        },
        "sts:AssumeRoleWithWebIdentity",
      ),
    });

    props.projectBucket.grantReadWrite(deployRole, "client/*");
    props.projectBucket.grantDelete(deployRole, "client/*");
    props.cloudfrontDistribution.grantCreateInvalidation(deployRole);

    deployRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ["ssm:GetParameter"],
        resources: [
          `arn:aws:ssm:${this.region}:${this.account}:parameter/${PARAMETER_BASE_PATH}/*`,
        ],
      }),
    );
  }
}
