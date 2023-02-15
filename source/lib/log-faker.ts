/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this
 * software and associated documentation files (the "Software"), to deal in the Software
 * without restriction, including without limitation the rights to use, copy, modify,
 * merge, publish, distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
 * INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
 * PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
 * SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */



import * as path from 'path';

import { Construct } from "constructs";
import {
  Aws,
  Duration,
  CfnResource,
  aws_s3 as s3,
  aws_iam as iam,
  aws_apigateway as apigateway,
  aws_lambda as lambda,
} from "aws-cdk-lib";

/**
 * cfn-nag suppression rule interface
 */
interface CfnNagSuppressRule {
    readonly id: string;
    readonly reason: string;
}

export function addCfnNagSuppressRules(resource: CfnResource, rules: CfnNagSuppressRule[]) {
    resource.addMetadata('cfn_nag', {
        rules_to_suppress: rules
    });
}


export interface LogFakerProps {
    readonly logBucketName: string,
    readonly logBucketPrefix: string,
}

export class LogFakerStack extends Construct {

    readonly fakerApiUrl: string;

    constructor(scope: Construct, id: string, props: LogFakerProps) {
        super(scope, id);

        // Create a lambda layer with required python packages.
        const fakerLayer = new lambda.LayerVersion(this, 'OpenSearchLayer', {
            code: lambda.Code.fromAsset(path.join(__dirname, '../lambda/layer'), {
                bundling: {
                    image: lambda.Runtime.PYTHON_3_9.bundlingImage,
                    command: [
                        'bash', '-c',
                        'pip install -r requirements.txt -t /asset-output/python'
                    ],
                },
            }),
            compatibleRuntimes: [lambda.Runtime.PYTHON_3_9],
            description: `${Aws.STACK_NAME} - Lambda layer for Log Faker`,
        });

        // Create the policy and role for the Lambda to create and delete CloudWatch Log Group Subscription Filter 
        const fakeLogGeneratorPolicy = new iam.Policy(this, 'fakeLogGeneratorPolicy', {
            policyName: `${Aws.STACK_NAME}-fakeLogGeneratorPolicy`,
            statements: [
                new iam.PolicyStatement({
                    actions: [
                        "logs:CreateLogGroup",
                        "logs:CreateLogStream",
                        "logs:PutLogEvents",
                        "logs:PutSubscriptionFilter",
                        "logs:DeleteSubscriptionFilter",
                        "logs:DescribeLogGroups",
                    ],
                    resources: [
                        `arn:${Aws.PARTITION}:logs:${Aws.REGION}:${Aws.ACCOUNT_ID}:*`,
                    ]
                }),
                // Set the resources to * for sending data to Centralized Logging Main Stack Default Logging Bucket.
                new iam.PolicyStatement({
                    actions: [
                        "s3:PutObject",
                        "s3:ListBucket",
                        "s3:PutObjectAcl",
                        "s3:AbortMultipartUpload",
                        "s3:ListBucketMultipartUploads",
                        "s3:ListMultipartUploadParts"
                    ],
                    resources: [
                        "*",
                    ]
                }),
            ]
        });
        const fakeLogGeneratorRole = new iam.Role(this, 'fakeLogGeneratorRole', {
            assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
        });
        fakeLogGeneratorPolicy.attachToRole(fakeLogGeneratorRole);

        // Lambda to create CloudWatch Log Group Subscription Filter 
        const fakeLogGenerator = new lambda.Function(this, 'fakeLogGenerator', {
            description: `${Aws.STACK_NAME} - Create Fake Logs`,
            runtime: lambda.Runtime.PYTHON_3_9,
            handler: 'lambda_function.lambda_handler',
            code: lambda.Code.fromAsset(path.join(__dirname, '../lambda/')),
            memorySize: 2048,
            timeout: Duration.minutes(10),
            role: fakeLogGeneratorRole,
            environment: {
                DEFAULT_LOG_S3_BUCKET_NAME: props.logBucketName,
                DEFAULT_LOG_S3_BUCKET_PREFIX: props.logBucketPrefix,
            },
            layers: [fakerLayer]
        })
        fakeLogGenerator.node.addDependency(fakeLogGeneratorRole, fakeLogGeneratorPolicy);
        
        // Get the logBucket
        const logBucket = s3.Bucket.fromBucketName(this, 'logBucket', props.logBucketName);

        logBucket.grantWrite(fakeLogGenerator)
        
        // Create the Api Gateway
        const api = new apigateway.RestApi(this, "widgets-api", {
            description: 'example api gateway',
            deployOptions: {
                stageName: 'dev',
            },
            // enable CORS
            defaultCorsPreflightOptions: {
                allowHeaders: [
                    'Content-Type',
                    'X-Amz-Date',
                    'Authorization',
                    'X-Api-Key',
                ],
                allowMethods: apigateway.Cors.ALL_METHODS,
                allowCredentials: true,
                allowOrigins: apigateway.Cors.ALL_ORIGINS,
            },
        });

        const widget = api.root.addResource("{logType}");
        // Add new widget to bucket with: POST /{logType}
        const postWidgetIntegration = new apigateway.LambdaIntegration(fakeLogGenerator);
        widget.addMethod("POST", postWidgetIntegration); // POST /{logType}

        this.fakerApiUrl = api.url;

    }
}
