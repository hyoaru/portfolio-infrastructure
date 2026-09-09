import {
  aws_cloudfront as cloudfront,
  aws_cloudfront_origins as cloudfrontOrigins,
  aws_iam as iam,
  aws_s3 as s3,
  aws_ssm as ssm,
  aws_certificatemanager as acm,
  aws_route53 as route53,
  aws_route53_targets as route53Targets,
} from "aws-cdk-lib";
import * as cdk from "aws-cdk-lib/core";
import { Construct } from "constructs";
import { PARAMETER_BASE_PATH } from "../constants";

interface WebStackProps extends cdk.StackProps {
  hostedZone: route53.HostedZone;
  projectBucket: s3.Bucket;
  certificateArn: string;
}

export class WebStack extends cdk.Stack {
  public readonly cloudfrontDistribution: cloudfront.Distribution;

  constructor(scope: Construct, id: string, props: WebStackProps) {
    super(scope, id, props);

    const projectBucket = s3.Bucket.fromBucketAttributes(
      this,
      "ProjectBucket",
      {
        bucketName: props.projectBucket.bucketName,
        bucketArn: props.projectBucket.bucketArn,
      },
    );

    new ssm.StringParameter(this, "ClientArtifactS3UriParameter", {
      parameterName: `/${PARAMETER_BASE_PATH}/client-artifact-s3-uri`,
      stringValue: `s3://${props.projectBucket.bucketName}/client/latest`,
    });

    new ssm.StringParameter(this, "ClientArtifactS3UriBaseParameter", {
      parameterName: `/${PARAMETER_BASE_PATH}/client-artifact-s3-uri-base`,
      stringValue: `s3://${props.projectBucket.bucketName}/client`,
    });

    const origin = cloudfrontOrigins.S3BucketOrigin.withOriginAccessControl(
      projectBucket,
      {
        originPath: "/client/latest",
      },
    );

    const certificate = acm.Certificate.fromCertificateArn(
      this,
      "Certificate",
      props.certificateArn,
    );

    this.cloudfrontDistribution = new cloudfront.Distribution(
      this,
      "CloudfrontDistribution",
      {
        domainNames: [props.hostedZone.zoneName],
        certificate: certificate,
        defaultRootObject: "index.html",
        defaultBehavior: {
          origin: origin,
          viewerProtocolPolicy:
            cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        },
        errorResponses: [
          {
            httpStatus: 403,
            responseHttpStatus: 200,
            responsePagePath: "/index.html",
            ttl: cdk.Duration.minutes(0),
          },
          {
            httpStatus: 404,
            responseHttpStatus: 200,
            responsePagePath: "/index.html",
            ttl: cdk.Duration.minutes(0),
          },
        ],
      },
    );
    cdk.Tags.of(this.cloudfrontDistribution).add("Name", "Portfolio");

    new ssm.StringParameter(this, "CloudfrontDistributionIdParameter", {
      parameterName: `/${PARAMETER_BASE_PATH}/cloudfront-distribution-id`,
      stringValue: this.cloudfrontDistribution.distributionId,
    });

    new s3.CfnBucketPolicy(this, "WebProjectBucketPolicy", {
      bucket: props.projectBucket.bucketName,
      policyDocument: new iam.PolicyDocument({
        statements: [
          new iam.PolicyStatement({
            actions: ["s3:GetObject"],
            resources: [`${props.projectBucket.bucketArn}/client/*`],
            principals: [new iam.ServicePrincipal("cloudfront.amazonaws.com")],
            conditions: {
              StringEquals: {
                "AWS:SourceArn": `arn:aws:cloudfront::${this.account}:distribution/${this.cloudfrontDistribution.distributionId}`,
              },
            },
          }),
        ],
      }),
    });

    new route53.ARecord(this, "CloudfrontDomainRecord", {
      zone: props.hostedZone,
      target: route53.RecordTarget.fromAlias(
        new route53Targets.CloudFrontTarget(this.cloudfrontDistribution),
      ),
    });
  }
}
