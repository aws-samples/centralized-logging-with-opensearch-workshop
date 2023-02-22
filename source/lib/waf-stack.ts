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
    Fn,
    Aws,
    aws_wafv2 as wafv2,
    aws_s3 as s3,
    aws_iam as iam,
    Duration,
    CfnResource,
    CustomResource,
    aws_lambda as lambda,
    custom_resources as cr,
} from "aws-cdk-lib";

import { KinesisFirehoseToS3 } from '@aws-solutions-constructs/aws-kinesisfirehose-s3';

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

export interface WafClusterProps {
    readonly albDnsNameArray: string[];
    readonly runType: string;
    readonly logBucket: s3.Bucket;
}

export class WafClusterStack extends Construct {

    readonly ec2AlbAddressName: any

    constructor(scope: Construct, id: string, props: WafClusterProps) {
        super(scope, id);

        // WAF
        const webACL = new wafv2.CfnWebACL(this, 'CentalWebACL', {
            defaultAction: {
                allow: {}
            },
            scope: 'REGIONAL',
            visibilityConfig: {
                cloudWatchMetricsEnabled: true,
                metricName: 'MetricForWebACLCDK',
                sampledRequestsEnabled: true,
            },
            name: `CentralCLWebACL`,
            rules: [
                {
                    name: 'AWSManagedRulesAmazonIpReputation',
                    priority: 0,
                    statement: {
                        managedRuleGroupStatement: {
                            name: 'AWSManagedRulesAmazonIpReputationList',
                            vendorName: 'AWS',
                        }
                    },
                    visibilityConfig: {
                        cloudWatchMetricsEnabled: true,
                        metricName: 'MetricForWebACLCDK-IpRep',
                        sampledRequestsEnabled: true,
                    },
                    overrideAction: {
                        none: {}
                    },
                },
                {
                    name: 'AWSManagedRulesCommonRule',
                    priority: 1,
                    statement: {
                        managedRuleGroupStatement: {
                            name: 'AWSManagedRulesCommonRuleSet',
                            vendorName: 'AWS',
                            excludedRules: [{ name: 'SizeRestrictions_BODY' }]
                        }
                    },
                    visibilityConfig: {
                        cloudWatchMetricsEnabled: true,
                        metricName: 'MetricForWebACLCDK-CRS',
                        sampledRequestsEnabled: true,
                    },
                    overrideAction: {
                        none: {}
                    },
                },
                {
                    name: 'AWSManagedRulesKnownBadInputsRule',
                    priority: 2,
                    statement: {
                        managedRuleGroupStatement: {
                            name: 'AWSManagedRulesKnownBadInputsRuleSet',
                            vendorName: 'AWS',
                        }
                    },
                    visibilityConfig: {
                        cloudWatchMetricsEnabled: true,
                        metricName: 'MetricForWebACLCDK-BAD',
                        sampledRequestsEnabled: true,
                    },
                    overrideAction: {
                        none: {}
                    },
                },
                {
                    name: 'AWSManagedRulesSQLiRule',
                    priority: 3,
                    statement: {
                        managedRuleGroupStatement: {
                            name: 'AWSManagedRulesSQLiRuleSet',
                            vendorName: 'AWS',
                        }
                    },
                    visibilityConfig: {
                        cloudWatchMetricsEnabled: true,
                        metricName: 'MetricForWebACLCDK-SQLi',
                        sampledRequestsEnabled: true,
                    },
                    overrideAction: {
                        none: {}
                    },
                }]
        });

        const wafLogging = new KinesisFirehoseToS3(this, 'wafLogging', {
            existingBucketObj: props.logBucket,
            kinesisFirehoseProps: {
                deliveryStreamName: `aws-waf-logs-${Aws.STACK_NAME}`,
                deliveryStreamType: 'DirectPut',
                deliveryStreamEncryptionConfigurationInput: {
                    keyType: 'AWS_OWNED_CMK'
                },
                extendedS3DestinationConfiguration: {
                    bufferingHints: {
                        intervalInSeconds: 300,
                        sizeInMBs: 5
                    },
                    compressionFormat: "GZIP",
                    prefix: 'AWSLog/WAFLogs/',
                    errorOutputPrefix: 'errors/year=!{timestamp:yyyy}/month=!{timestamp:MM}/day=!{timestamp:dd}/hour=!{timestamp:HH}/!{firehose:error-output-type}'
                }
            }
        })

        // Create the policy and role for the Lambda to create and delete CloudWatch Log Group Subscription Filter
        const wafAssociationHelperFnPolicy = new iam.Policy(
            this,
            "wafAssociationHelperFnPolicy",
            {
                policyName: `${Aws.STACK_NAME}-wafAssociationHelperFnPolicy`,
                statements: [
                    new iam.PolicyStatement({
                        actions: [
                            "logs:CreateLogGroup",
                            "logs:CreateLogStream",
                            "logs:PutLogEvents",
                            "logs:PutSubscriptionFilter",
                            "logs:putDestination",
                            "logs:putDestinationPolicy",
                            "logs:DeleteSubscriptionFilter",
                            "logs:DescribeLogGroups",
                        ],
                        resources: [
                            `arn:${Aws.PARTITION}:logs:${Aws.REGION}:${Aws.ACCOUNT_ID}:*`,
                        ],
                    }),
                    new iam.PolicyStatement({
                        actions: [
                            "elasticloadbalancing:DescribeLoadBalancers",
                            "elasticloadbalancing:SetWebACL"
                        ],
                        resources: [`*`], // Here we have to set the resource to *, or the lambda will break.
                    }),
                    new iam.PolicyStatement({
                        actions: [
                            "wafv2:AssociateWebACL",
                            "wafv2:DisassociateWebACL",
                            "wafv2:PutLoggingConfiguration",
                            "wafv2:DeleteLoggingConfiguration"
                        ],
                        resources: [`arn:${Aws.PARTITION}:wafv2:${Aws.REGION}:${Aws.ACCOUNT_ID}:*`]
                    }),
                ],
            }
        );
        const wafAssociationHelperFnRole = new iam.Role(this, "wafAssociationHelperFnRole", {
            assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
        });
        wafAssociationHelperFnPolicy.attachToRole(wafAssociationHelperFnRole);

        // Lambda to create WAF Association for ALB
        const wafAssociationHelperFn = new lambda.Function(this, "wafAssociationHelperFn", {
            description: `${Aws.STACK_NAME} - Create WAF Association for ALBs`,
            runtime: lambda.Runtime.PYTHON_3_9,
            handler: "waf_association_helper.lambda_handler",
            code: lambda.Code.fromAsset(
                path.join(__dirname, "../lambda/")
            ),
            memorySize: 256,
            timeout: Duration.seconds(60),
            role: wafAssociationHelperFnRole,
            environment: {
                ALB_DNS_NAMES: Fn.join(",", props.albDnsNameArray),
                WAF_ACL_ARN: webACL.attrArn,
                KDF_ARN: wafLogging.kinesisFirehose.attrArn
            },
        });
        wafAssociationHelperFn.node.addDependency(webACL);

        const wafAssociationHelperProvider = new cr.Provider(this, "wafAssociationHelperProvider", {
            onEventHandler: wafAssociationHelperFn,
        });

        wafAssociationHelperProvider.node.addDependency(wafAssociationHelperFn);

        const wafAssociationHelperlambdaTrigger = new CustomResource(
            this,
            "wafAssociationHelperlambdaTrigger",
            {
                serviceToken: wafAssociationHelperProvider.serviceToken,
            }
        );

        wafAssociationHelperlambdaTrigger.node.addDependency(wafAssociationHelperProvider);


    }
}
