#!/usr/bin/env node
import * as cdk from "aws-cdk-lib/core";
import "dotenv/config";
import { ApplicationStage } from "../lib/stages";

const app = new cdk.App();
cdk.Tags.of(app).add("Project", "Portfolio");

const staging = new ApplicationStage(app, "PortfolioStaging", {
  env: {
    account: process.env.STAGING_ACCOUNT_ID,
    region: process.env.CDK_DEFAULT_REGION,
  },
  environment: "staging",
  removalPolicy: cdk.RemovalPolicy.DESTROY,
  zoneName: `staging.${process.env.APEX_DOMAIN}`,
});

cdk.Tags.of(staging).add("Environment", "Staging");

const production = new ApplicationStage(app, "PortfolioProduction", {
  env: {
    account: process.env.PRODUCTION_ACCOUNT_ID,
    region: process.env.CDK_DEFAULT_REGION,
  },
  environment: "production",
  removalPolicy: cdk.RemovalPolicy.RETAIN,
  zoneName: `production.${process.env.APEX_DOMAIN}`,
});

cdk.Tags.of(production).add("Environment", "Production");
