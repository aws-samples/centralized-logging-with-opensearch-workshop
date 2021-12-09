#!/usr/bin/env node
import * as cdk from '@aws-cdk/core';
import 'source-map-support/register';
import { MainStack } from '../lib/workshop-stack';

const app = new cdk.App();
new MainStack(app, 'CdkWorkshopStack');