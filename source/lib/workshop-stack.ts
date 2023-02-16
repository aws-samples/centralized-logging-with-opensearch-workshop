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

import * as path from 'path'

import { Construct } from "constructs";
import {
  Fn,
  SecretValue,
  RemovalPolicy,
  Stack,
  StackProps,
  Duration,
  CfnOutput,
  Aws,
  aws_wafv2 as wafv2,
  CustomResource,
  aws_lambda as lambda,
  custom_resources as cr,
  aws_s3 as s3,
  aws_s3_deployment as s3d,
  aws_iam as iam,
  aws_cloudfront as cdn,
  aws_cloudfront_origins as origins,
  aws_ec2 as ec2, // import ec2 library
  aws_rds as rds,
  aws_opensearchservice as opensearch,
} from "aws-cdk-lib";

import { OriginAccessIdentity } from 'aws-cdk-lib/aws-cloudfront';

import { LogFakerStack, LogFakerProps } from './log-faker';
import { Ec2ClusterStack, Ec2ClusterProps } from './ec2-cluster-stack'
import { EksClusterStack, EksClusterProps } from './eks-cluster-stack'

const { VERSION } = process.env;

const workshopDB_user = 'admin';
const workshopDB_secretName = 'workshopDBSecret'
const workshopDB_name = 'workshopDB';
const workshopOpensearch_name = 'workshop-os';
const workshopOpensearch_username = 'admin';
const workshopOpensearch_password = SecretValue.unsafePlainText('CentralizedLogging@@123');

export interface MainProps extends StackProps {
  /**
   * E-Commerce Web Site Structure type, it can be hosted on EC2, EKS or both of them.
   */
  runType?: string;
}

export const enum RunType {
  EC2 = "EC2",
  EKS = "EKS",
  EC2_AND_EKS = "EC2_AND_EKS"
}

export class MainStack extends Stack {
  constructor(scope: Construct, id: string, props: MainProps) {
    super(scope, id, props);

    this.templateOptions.description = `Centralized Logging with OpenSearch Workshop Stack. Template version ${VERSION}`;

    var albDnsNameArray: string[] = [];

    // upload workshop simple app to s3.
    const webSiteS3 = new s3.Bucket(this, 'clWorkshopWeb', {
      autoDeleteObjects: true,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    // upload static images to s3, will be exposed through cdn.
    new s3d.BucketDeployment(this, 'DeployWebAssets', {
      sources: [s3d.Source.asset(path.join(__dirname, '../s3'))],
      destinationBucket: webSiteS3,
      destinationKeyPrefix: 'assets',
      prune: false,
    });
    const oai = new OriginAccessIdentity(this, 'OAI');
    const cloudFrontToS3 = new cdn.Distribution(this, 'CDNWorkshopAssets', {
      defaultBehavior: {
        origin: new origins.S3Origin(webSiteS3, {
          originPath: 'assets',
          originAccessIdentity: oai
        }),
      },
      minimumProtocolVersion: cdn.SecurityPolicyProtocol.TLS_V1_2_2021,
      enableLogging: true,
      logBucket: webSiteS3,
      logFilePrefix: 'distribution-access-logs/',
      comment: 'CentralizedLogging-Workshop Assets'
    });
    webSiteS3.grantRead(oai)
    cloudFrontToS3.node.addDependency(webSiteS3) // Avoid CDN Log send to the S3 after autoDeleteObject Lambda is deleted.

    // upload simple web page to s3
    const simpleAppUpload = new s3d.BucketDeployment(this, 'DeployWorkshopWeb', {
      sources: [
        s3d.Source.asset(path.join(__dirname, '../simple-app'), { exclude: ['node_modules'] })
      ],
      destinationBucket: webSiteS3,
      prune: false,
    });

    // VPC
    const workshopVpc = new ec2.Vpc(this, 'workshopVpc', {
      maxAzs: 2,
      natGateways: 1,
      cidr: '10.0.0.0/16',
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        }
      ]
    });

    // Log Faker
    const logFakerProps: LogFakerProps = {
      logBucketName: webSiteS3.bucketName,
      logBucketPrefix: 'distribution-access-logs/',
    }
    const logFaker = new LogFakerStack(this, 'logFakerStack', logFakerProps)

    // RDS
    // 1. create a secret manager first.
    const rdsSecret = new rds.DatabaseSecret(
      this,
      'rdsSecret',
      {
        username: workshopDB_user,
        secretName: workshopDB_secretName
      }
    );

    // 2. security group
    const dbSecurityGroup = new ec2.SecurityGroup(this, "workshopDBSecurityGroup", {
      vpc: workshopVpc,

    })

    // 3. create DB using the secret
    const dbEngine = rds.DatabaseInstanceEngine.mysql({
      version: rds.MysqlEngineVersion.VER_8_0_25
    });
    const workshopDB = new rds.DatabaseInstance(this, 'workshopDB', {
      instanceIdentifier: 'workshop-db',
      engine: dbEngine,
      vpc: workshopVpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS
      },
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.BURSTABLE2, ec2.InstanceSize.MICRO),
      removalPolicy: RemovalPolicy.DESTROY,
      databaseName: workshopDB_name,
      backupRetention: Duration.days(0),
      credentials: rds.Credentials.fromSecret(rdsSecret, workshopDB_user),
      publiclyAccessible: false,
      securityGroups: [dbSecurityGroup],
      parameterGroup: new rds.ParameterGroup(this, 'parameterGroup', {
        engine: dbEngine,
        parameters: {
          slow_query_log: '1',
          long_query_time: '1',
          log_output: 'FILE'
        }
      }),
      optionGroup: new rds.OptionGroup(this, 'optionGroup', {
        engine: dbEngine,
        configurations: [{
          name: 'MARIADB_AUDIT_PLUGIN',
        }]
      }),
      cloudwatchLogsExports: ['error', 'slowquery', 'audit']
    });

    if (props.runType === RunType.EC2 || props.runType === RunType.EC2_AND_EKS) {
      // EC2 Cluster
      const ec2ClusterProps: Ec2ClusterProps = {
        fakerApiUrl: logFaker.fakerApiUrl,
        dbSecretName: workshopDB_secretName,
        domainName: cloudFrontToS3.domainName,
        workshopVpc: workshopVpc,
        webSiteS3: webSiteS3,
        dbSecurityGroup: dbSecurityGroup,
        workshopDB: workshopDB,
        cloudFrontToS3: cloudFrontToS3,
        simpleAppUpload: simpleAppUpload,
        logFaker: logFaker
      }
      const ec2ClusterStack = new Ec2ClusterStack(this, 'ec2ClusterStack', ec2ClusterProps)
      new CfnOutput(this, 'AlbEC2HostedWebsiteAddress', {
        description: "ALB CName for EC2 hosted demo website",
        value: ec2ClusterStack.ec2AlbAddressName
      })
      albDnsNameArray.push(ec2ClusterStack.ec2AlbAddressName);
    }

    if (props.runType === RunType.EKS || props.runType === RunType.EC2_AND_EKS) {
      // EKS Cluster
      const eksClusterProps: EksClusterProps = {
        fakerApiUrl: logFaker.fakerApiUrl,
        dbSecretName: workshopDB_secretName,
        domainName: cloudFrontToS3.domainName,
        workshopVpc: workshopVpc,
        webSiteS3: webSiteS3,
        dbSecurityGroup: dbSecurityGroup,
      }
      const eksClusterStack = new EksClusterStack(this, 'eksClusterStack', eksClusterProps)
      new CfnOutput(this, "AlbEKSHostedWebsiteAddress", {
        description: "ALB CName for EKS hosted demo website",
        value: eksClusterStack.eksAlbAddressName,
      })
      albDnsNameArray.push(eksClusterStack.eksAlbAddressName);
    }

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
      name: `CentralCLWebACL-${props.runType}`,
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
        ALB_DNS_NAMES: Fn.join(",", albDnsNameArray),
        WAF_ACL_ARN: webACL.attrArn,
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

    // Open Search
    const workshopOpensearch = new opensearch.Domain(this, 'workshopOpensearch', {
      domainName: workshopOpensearch_name,
      version: opensearch.EngineVersion.OPENSEARCH_2_3,
      removalPolicy: RemovalPolicy.DESTROY,
      vpc: workshopVpc,
      vpcSubnets: [workshopVpc.selectSubnets({ subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS, availabilityZones: [workshopVpc.availabilityZones[0]] })],
      capacity: {
        dataNodes: 2,
        dataNodeInstanceType: 'r6g.large.search',
      },
      nodeToNodeEncryption: true,
      encryptionAtRest: {
        enabled: true
      },
      enforceHttps: true,
      fineGrainedAccessControl: {
        masterUserName: workshopOpensearch_username,
        masterUserPassword: workshopOpensearch_password
      },
      accessPolicies: [new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['es:*'],
        principals: [
          new iam.AnyPrincipal
        ],
        resources: [
          `arn:aws:es:${this.region}:${this.account}:domain/${workshopOpensearch_name}/*`
        ]
      })]
    });
    workshopOpensearch.connections.allowFromAnyIpv4(ec2.Port.tcp(443));


  }
}