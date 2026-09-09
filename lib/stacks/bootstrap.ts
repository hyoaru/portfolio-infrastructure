import { aws_s3 as s3 } from "aws-cdk-lib";
import * as cdk from "aws-cdk-lib/core";
import { Construct } from "constructs";

interface BootstrapStackProps extends cdk.StackProps {
  removalPolicy: cdk.RemovalPolicy;
}

export class BootstrapStack extends cdk.Stack {
  public readonly projectBucket: s3.Bucket;

  constructor(scope: Construct, id: string, props: BootstrapStackProps) {
    super(scope, id, props);

    this.projectBucket = new s3.Bucket(this, "ProjectBucket", {
      bucketName: `portfolio-${this.account}`,
      bucketNamespace: s3.BucketNamespace.GLOBAL,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      objectOwnership: s3.ObjectOwnership.BUCKET_OWNER_ENFORCED,
      encryption: s3.BucketEncryption.S3_MANAGED,
      versioned: false,
      enforceSSL: true,
      bucketKeyEnabled: true,
      autoDeleteObjects: props.removalPolicy == cdk.RemovalPolicy.DESTROY,
      removalPolicy: props.removalPolicy,
    });
  }
}
