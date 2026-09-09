import * as cdk from "aws-cdk-lib/core";
import { Construct } from "constructs";
import {
  BootstrapStack,
  DeploymentStack,
  DnsStack,
  WebCertificate,
  WebStack,
} from "../stacks";

interface ApplicationStageProps extends cdk.StageProps {
  environment: string;
  removalPolicy: cdk.RemovalPolicy;
  zoneName: string;
}

export class ApplicationStage extends cdk.Stage {
  constructor(scope: Construct, id: string, props: ApplicationStageProps) {
    super(scope, id, props);

    const dnsStack = new DnsStack(this, "Dns", {
      zoneName: props.zoneName,
    });

    const bootstrapStack = new BootstrapStack(this, "Bootstrap", {
      removalPolicy: props.removalPolicy,
    });

    const webCertificateStack = new WebCertificate(this, "WebCertificate", {
      env: { account: this.account, region: "us-east-1" },
      hostedZone: dnsStack.hostedZone,
    });

    const webStack = new WebStack(this, "Web", {
      hostedZone: dnsStack.hostedZone,
      projectBucket: bootstrapStack.projectBucket,
      certificateArn: webCertificateStack.certificate.certificateArn,
    });

    new DeploymentStack(this, "Deployment", {
      projectBucket: bootstrapStack.projectBucket,
      cloudfrontDistribution: webStack.cloudfrontDistribution,
    });
  }
}
