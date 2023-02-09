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

import { readFileSync } from 'fs';
import * as path from 'path'

import { Construct } from "constructs";
import {
  SecretValue,
  RemovalPolicy,
  Stack,
  StackProps,
  Duration,
  CfnOutput,
  aws_s3 as s3,
  aws_s3_deployment as s3d,
  aws_iam as iam,
  aws_autoscaling as au,
  aws_cloudfront as cdn,
  aws_cloudfront_origins as origins,
  aws_ec2 as ec2, // import ec2 library
  aws_elasticloadbalancingv2 as elbv2, // import elb2 library
  aws_rds as rds,
  aws_opensearchservice as opensearch,
} from "aws-cdk-lib";

import { OriginAccessIdentity } from 'aws-cdk-lib/aws-cloudfront';

import { LogFakerStack, LogFakerProps } from './log-faker';
import { EksClusterStack, EksClusterProps } from './eks-cluster-stack'

const { VERSION } = process.env;

const workshopDB_user = 'admin';
const workshopDB_secretName = 'workshopDBSecret'
const workshopDB_name = 'workshopDB';
const workshopOpensearch_name = 'workshop-os';
const workshopOpensearch_username = 'admin';
const workshopOpensearch_password = SecretValue.unsafePlainText('CentralizedLogging@@123');

export class MainStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    this.templateOptions.description = `E-Commerce Demo Site for Centralized Logging workshop. Template version ${VERSION}`;

    // upload workshop simple app to s3.
    const webSiteS3 = new s3.Bucket(this, 'clWorkshopWebsite', {
      autoDeleteObjects: true,
      removalPolicy: RemovalPolicy.DESTROY
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

    // upload simple web page to s3
    const simpleAppUpload = new s3d.BucketDeployment(this, 'DeployWorkshopWebSite', {
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

    // ASG
    const workshopASG = new au.AutoScalingGroup(this, 'workshopASG', {
      instanceType: new ec2.InstanceType("t4g.large"),
      vpc: workshopVpc,
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
    workshopASG.node.addDependency(workshopDB);
    workshopASG.node.addDependency(cloudFrontToS3);
    workshopASG.node.addDependency(simpleAppUpload);
    workshopASG.node.addDependency(logFaker);
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
      `echo '${workshopDB.instanceIdentifier}'`,
      `aws s3 cp '${webSiteS3.s3UrlForObject('ui')}' '/var/www/ui' --recursive`,
      `aws s3 cp '${webSiteS3.s3UrlForObject('server')}' '/var/www/server' --recursive`,
      `echo $(aws secretsmanager get-secret-value --secret-id ${workshopDB_secretName} --query SecretString --output json --region ${this.region}) > /var/www/inc/dbinfo.json`,
      `echo '${mergeScript}' > mergeDBInfo.js`,
      'node mergeDBInfo.js',
      'cd /var/www/ui',
      'npm install && npm run build',
      'yes | cp -r /var/www/ui/build/* /usr/share/nginx/html/',
      'chkconfig nginx on',
      'service nginx start',
      'service nginx restart',
      `sed -i 's/$WORKSHOP_CDN_DOMAIN/${cloudFrontToS3.domainName}/' /var/www/server/src/controllers/mockdata.ts`,
      `sed -i 's/daily/monthly/' /etc/logrotate.d/nginx`,
      `echo "{\\"fakerAPIUrl\\":\\"${logFaker.fakerApiUrl}\\"}" > /usr/share/nginx/html/config.json`,
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
      vpc: workshopVpc,
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

    // Connections
    dbSecurityGroup.connections.allowFrom(workshopASG, ec2.Port.tcp(3306));
    dbSecurityGroup.connections.allowFrom(workshopASG, ec2.Port.tcp(22));

    // Open Search
    const workshopOpensearch = new opensearch.Domain(this, 'workshopOpensearch', {
      domainName: workshopOpensearch_name,
      version: opensearch.EngineVersion.OPENSEARCH_2_3,
      removalPolicy: RemovalPolicy.DESTROY,
      vpc: workshopVpc,
      vpcSubnets: [workshopVpc.selectSubnets({ subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS, availabilityZones: [workshopVpc.availabilityZones[0]] })],
      capacity: {
        dataNodes: 2,
        dataNodeInstanceType: 'r6g.xlarge.search',
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

    // EKS Cluster
    const eksClusterProps: EksClusterProps = {
      fakerApiUrl: logFaker.fakerApiUrl,
      dbSecretName: workshopDB_secretName,
      domainName: cloudFrontToS3.domainName,
      workshopVpc: workshopVpc,
      webSiteS3: webSiteS3,
      dbSecurityGroup: dbSecurityGroup,
    }
    new EksClusterStack(this, 'eksClusterStack', eksClusterProps)

    // Outputs
    new CfnOutput(this, 'Region', { value: this.region })
    new CfnOutput(this, 'EC2 Model ALB CNAME', { value: workshopEC2Alb.loadBalancerDnsName })
    new CfnOutput(this, 'EKS Model NLB CNAME', { value: `Please go to \"https://${this.region}.console.aws.amazon.com/ec2/home?region=${this.region}#LoadBalancers:\" to find the NLB CNAME` })
    new CfnOutput(this, 'dbEndpoint', { value: workshopDB.instanceEndpoint.hostname });

    new CfnOutput(this, 's3Bucket', {
      value: webSiteS3.bucketArn,
    });
    new CfnOutput(this, 'opensearchDomain', {
      value: workshopOpensearch.domainEndpoint
    });
    new CfnOutput(this, 'cloudFront', {
      value: cloudFrontToS3.domainName
    });
    new CfnOutput(this, 'fakerAPIURL', {
      value: logFaker.fakerApiUrl
    })
  }
}