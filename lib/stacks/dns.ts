import { aws_route53 as route53 } from "aws-cdk-lib";
import * as cdk from "aws-cdk-lib/core";
import { Construct } from "constructs";

interface DnsStackProps extends cdk.StackProps {
  zoneName: string;
}

export class DnsStack extends cdk.Stack {
  public readonly hostedZone: route53.HostedZone;

  constructor(scope: Construct, id: string, props: DnsStackProps) {
    super(scope, id, props);

    this.hostedZone = new route53.HostedZone(this, "HostedZone", {
      zoneName: props.zoneName,
    });
  }
}
