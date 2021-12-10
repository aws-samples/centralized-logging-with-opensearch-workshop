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
 
import * as au from '@aws-cdk/aws-autoscaling';
import * as cdk from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2' // import ec2 library 
import * as elbv2 from '@aws-cdk/aws-elasticloadbalancingv2' // import elb2 library

export class MainStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

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
      }
    })

    workshopASG.addUserData(readFileSync('./lib/user-data.sh', 'utf8'));

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
    })

    listener.addTargets('ApplicationFleet', {
      port: 80,
      targets: [workshopASG]
    })
    
    new cdk.CfnOutput(this, 'Region', { value: this.region })
    new cdk.CfnOutput(this, 'ALB CNAME', { value: workshopAlb.loadBalancerDnsName })
  }
}