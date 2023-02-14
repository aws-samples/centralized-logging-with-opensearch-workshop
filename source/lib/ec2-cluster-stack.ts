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
import { readFileSync } from 'fs';

import { Construct } from "constructs";
import {
    Aws,
    aws_wafv2 as wafv2,
    aws_iam as iam,
    aws_autoscaling as au,
    CfnResource,
    aws_s3 as s3,
    aws_ec2 as ec2, // import ec2 library
    aws_elasticloadbalancingv2 as elbv2, // import elb2 library
    aws_rds as rds,
    aws_s3_deployment as s3d,
    aws_cloudfront as cdn,
} from "aws-cdk-lib";
import { IVpc } from 'aws-cdk-lib/aws-ec2';

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

export interface Ec2ClusterProps {
    readonly fakerApiUrl: string;
    readonly dbSecretName: string;
    readonly domainName: string;
    workshopVpc: IVpc;
    webSiteS3: s3.Bucket;
    dbSecurityGroup: ec2.SecurityGroup;
    workshopDB: rds.DatabaseInstance;
    cloudFrontToS3: cdn.Distribution;
    simpleAppUpload: s3d.BucketDeployment;
    logFaker: any;
}

export class Ec2ClusterStack extends Construct {

    readonly ec2AlbAddressName: any

    constructor(scope: Construct, id: string, props: Ec2ClusterProps) {
        super(scope, id);

        // ASG
        const workshopASG = new au.AutoScalingGroup(this, 'workshopASG', {
            instanceType: new ec2.InstanceType("t4g.large"),
            vpc: props.workshopVpc,
            machineImage: ec2.MachineImage.latestAmazonLinux({
                generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
                edition: ec2.AmazonLinuxEdition.STANDARD,
                virtualization: ec2.AmazonLinuxVirt.HVM,
                storage: ec2.AmazonLinuxStorage.GENERAL_PURPOSE,
                cpuType: ec2.AmazonLinuxCpuType.ARM_64,
            }),
            desiredCapacity: 2,
            minCapacity: 2,
            maxCapacity: 2,
            signals: au.Signals.waitForMinCapacity(),
            vpcSubnets: {
                subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
                onePerAz: true
            },
            updatePolicy: au.UpdatePolicy.rollingUpdate()
        });
        workshopASG.node.addDependency(props.workshopDB);
        workshopASG.node.addDependency(props.cloudFrontToS3);
        workshopASG.node.addDependency(props.simpleAppUpload);
        workshopASG.node.addDependency(props.logFaker);
        workshopASG.role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'));
        workshopASG.role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('SecretsManagerReadWrite'));
        workshopASG.role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonS3ReadOnlyAccess'));
        workshopASG.applyCloudFormationInit(
            ec2.CloudFormationInit.fromElements(
                ec2.InitFile.fromFileInline(
                    '/etc/nginx/nginx.conf',
                    path.join(__dirname, "./nginx.config")
                ),
                ec2.InitFile.fromFileInline(
                    '/etc/init.d/java.sh',
                    path.join(__dirname, "./java.sh")
                ),
                ec2.InitFile.fromFileInline(
                    '/etc/init.d/node.sh',
                    path.join(__dirname, "./node.sh")
                )
            )
        );
        workshopASG.addUserData(readFileSync('./lib/user-data.sh', 'utf8'));
        const mergeScript = `var a  = JSON.parse(require("/var/www/inc/dbinfo.json"));\
      var b = require("/var/www/server/ormconfig.json");\
      var output = Object.assign({}, b, a);\
      output.database = a.dbname;\
      var fs = require("fs");\
      fs.writeFile("/var/www/server/ormconfig.json", JSON.stringify(output), function(err){});`;
        workshopASG.userData.addCommands(
            `echo '${props.workshopDB.instanceIdentifier}'`,
            `aws s3 cp '${props.webSiteS3.s3UrlForObject('ui')}' '/var/www/ui' --recursive`,
            `aws s3 cp '${props.webSiteS3.s3UrlForObject('server')}' '/var/www/server' --recursive`,
            `echo $(aws secretsmanager get-secret-value --secret-id ${props.dbSecretName} --query SecretString --output json --region ${Aws.REGION}) > /var/www/inc/dbinfo.json`,
            `echo '${mergeScript}' > mergeDBInfo.js`,
            'node mergeDBInfo.js',
            'cd /var/www/ui',
            'sed -i "s/OpenSearch Workshop/OpenSearch Workshop (EC2)/" /var/www/ui/public/index.html',
            'sed -i "s/OpenSearch Workshop/OpenSearch Workshop (EC2)/" /var/www/ui/src/pages/common/Nav.tsx',
            'npm install && npm run build',
            'yes | cp -r /var/www/ui/build/* /usr/share/nginx/html/',
            'chkconfig nginx on',
            'service nginx start',
            'service nginx restart',
            `sed -i 's/$WORKSHOP_CDN_DOMAIN/${props.cloudFrontToS3.domainName}/' /var/www/server/src/controllers/mockdata.ts`,
            `sed -i 's/daily/monthly/' /etc/logrotate.d/nginx`,
            `echo "{\\"fakerAPIUrl\\":\\"${props.logFaker.fakerApiUrl}\\"}" > /usr/share/nginx/html/config.json`,
            'chmod a+x /etc/init.d/java.sh',
            'chkconfig --add /etc/init.d/java.sh',
            'chkconfig on java.sh',
            'service java.sh start',
            'chmod a+x /etc/init.d/node.sh',
            'chkconfig --add /etc/init.d/node.sh',
            'chkconfig on node.sh',
            'service node.sh start'
        );

        // ELB for EC2 Model
        const workshopEC2Alb = new elbv2.ApplicationLoadBalancer(this, 'workshopEC2Alb', {
            vpc: props.workshopVpc,
            internetFacing: true,
            vpcSubnets: {
                subnetType: ec2.SubnetType.PUBLIC
            }
        });

        const listenerEC2 = workshopEC2Alb.addListener('ListenerEC2', {
            port: 80
        });

        listenerEC2.addTargets('ApplicationFleetEC2', {
            port: 80,
            targets: [workshopASG]
        });

        // WAF
        const ec2WebACL = new wafv2.CfnWebACL(this, 'EC2WebAcl', {
            defaultAction: {
                allow: {}
            },
            scope: 'REGIONAL',
            visibilityConfig: {
                cloudWatchMetricsEnabled: true,
                metricName: 'MetricForEC2WebACLCDK',
                sampledRequestsEnabled: true,
            },
            name: 'CLWorkshopEC2WebAcl',
            description: 'Web Acl for Centralized Logging with OpenSearch workshop EC2 Structure',
            rules: [{
                name: 'CRSRule',
                priority: 0,
                statement: {
                    managedRuleGroupStatement: {
                        name: 'AWSManagedRulesCommonRuleSet',
                        vendorName: 'AWS',
                        excludedRules: [{ name: 'SizeRestrictions_BODY' }]
                    }
                },
                visibilityConfig: {
                    cloudWatchMetricsEnabled: true,
                    metricName: 'MetricForEC2WebACLCDK-CRS',
                    sampledRequestsEnabled: true,
                },
                overrideAction: {
                    none: {}
                },
            }]
        })
        new wafv2.CfnWebACLAssociation(this, 'EC2WebACLAssociation', {
            resourceArn: workshopEC2Alb.loadBalancerArn,
            webAclArn: ec2WebACL.attrArn,
        });

        // Connections
        props.dbSecurityGroup.connections.allowFrom(workshopASG, ec2.Port.tcp(3306));
        props.dbSecurityGroup.connections.allowFrom(workshopASG, ec2.Port.tcp(22));

        this.ec2AlbAddressName = workshopEC2Alb.loadBalancerDnsName
    }
}
