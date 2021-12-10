#!/usr/bin/env node
import * as cdk from '@aws-cdk/core';
import 'source-map-support/register';
import { MainStack } from '../lib/workshop-stack';

const app = new cdk.App();

const env = {
    region: process.env.CDK_DEFAULT_REGION,
    account: process.env.CDK_DEFAULT_ACCOUNT
};

new MainStack(app, 'CdkWorkshopStack', { env });