import {
  aws_certificatemanager as acm,
  aws_route53 as route53,
} from "aws-cdk-lib";
import * as cdk from "aws-cdk-lib/core";
import { Construct } from "constructs";

interface WebCertificateProps extends cdk.StackProps {
  hostedZone: route53.HostedZone;
}

export class WebCertificate extends cdk.Stack {
  public readonly certificate: acm.Certificate;

  constructor(scope: Construct, id: string, props: WebCertificateProps) {
    super(scope, id, props);

    this.certificate = new acm.Certificate(this, "Certificate", {
      domainName: props.hostedZone.zoneName,
      subjectAlternativeNames: [props.hostedZone.zoneName],
      validation: acm.CertificateValidation.fromDns(props.hostedZone),
    });
  }
}
