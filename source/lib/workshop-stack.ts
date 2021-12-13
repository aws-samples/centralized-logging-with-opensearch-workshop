/**
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 *  Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance
 *  with the License. A copy of the License is located at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  or in the 'license' file accompanying this file. This file is distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES
 *  OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions
 *  and limitations under the License.
 */
import {readFileSync} from 'fs';
import * as path from 'path'

import * as au from '@aws-cdk/aws-autoscaling';
import * as cdk from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2' // import ec2 library 
import * as elbv2 from '@aws-cdk/aws-elasticloadbalancingv2' // import elb2 library
import * as rds from '@aws-cdk/aws-rds';
import * as iam from '@aws-cdk/aws-iam';
import * as s3d from '@aws-cdk/aws-s3-deployment';
import { CloudFrontToS3 } from '@aws-solutions-constructs/aws-cloudfront-s3';

const workshopDB_user = 'logHubWorkshopUser';
const workshopDB_secretName = 'logHubWorkshopSecret'
const workshopDB_name = 'workshopDB';

export class MainStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // S3 and cloudfront
    const cloudFrontToS3 = new CloudFrontToS3(this, 'log-hub-workshop-cloudfront-s3', {});
    const s3Bucket = cloudFrontToS3.s3Bucket!;
    // upload simple web page and static file to s3
    new s3d.BucketDeployment(this, 'DeployWebAssets', {
      sources: [s3d.Source.asset(path.join(__dirname, '../s3'))],
      destinationBucket: s3Bucket,
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
          name: 'ingress',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'application',
          subnetType: ec2.SubnetType.PRIVATE_WITH_NAT,
        }
      ]
    });

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
    const workshopDB = new rds.DatabaseInstance(this, 'workshopDB', {
      engine: rds.DatabaseInstanceEngine.mysql({
        version: rds.MysqlEngineVersion.VER_8_0_25
      }),
      vpc: workshopVpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_NAT
      },
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.BURSTABLE2, ec2.InstanceSize.MICRO),
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      databaseName: workshopDB_name,
      backupRetention: cdk.Duration.days(0),
      credentials: rds.Credentials.fromSecret(rdsSecret, workshopDB_user),
      publiclyAccessible: false,
      securityGroups: [dbSecurityGroup]
    });

    // ASG
    const workshopASG = new au.AutoScalingGroup(this, 'workshopASG', {
      instanceType: new ec2.InstanceType("t2.micro"),
      vpc: workshopVpc,
      machineImage: new ec2.AmazonLinuxImage({ generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2 }),
      desiredCapacity: 2,
      minCapacity: 2,
      maxCapacity: 2,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_NAT,
        onePerAz: true
      },
      updatePolicy: au.UpdatePolicy.rollingUpdate()
    });
    workshopASG.node.addDependency(workshopDB);
    workshopASG.role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'));
    workshopASG.role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('SecretsManagerReadWrite'));
    workshopASG.role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonS3ReadOnlyAccess'));
    workshopASG.addUserData(readFileSync('./lib/user-data.sh', 'utf8'));
    workshopASG.userData.addS3DownloadCommand({
      bucket: s3Bucket,
      bucketKey: "samplePage.php",
      localFile: "/var/www/html/samplePage.php"
    });

    // ELB
    const workshopAlb = new elbv2.ApplicationLoadBalancer(this, 'workshopAlb', {
      vpc: workshopVpc,
      internetFacing: true,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC
      }
    });

    const listener = workshopAlb.addListener('Listener', {
      port: 80
    });

    listener.addTargets('ApplicationFleet', {
      port: 80,
      targets: [workshopASG]
    });

    // Connections
    dbSecurityGroup.connections.allowFrom(workshopASG, ec2.Port.tcp(3306));
    dbSecurityGroup.connections.allowFrom(workshopASG, ec2.Port.tcp(22));
    
    // Outputs
    new cdk.CfnOutput(this, 'Region', { value: this.region })
    new cdk.CfnOutput(this, 'ALB CNAME', { value: workshopAlb.loadBalancerDnsName })
    new cdk.CfnOutput(this, 'dbEndpoint', { value: workshopDB.instanceEndpoint.hostname });

    new cdk.CfnOutput(this, 's3Bucket', {
      value: cloudFrontToS3.s3Bucket?.bucketArn!,
    });
    new cdk.CfnOutput(this, 's3LoggingBucket', {
      value: cloudFrontToS3.s3LoggingBucket?.bucketArn!,
    });
    new cdk.CfnOutput(this, 'cloudFrontLoggingBucket', {
      value: cloudFrontToS3.cloudFrontLoggingBucket?.bucketArn!,
    });
  }
}