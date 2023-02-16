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
    CfnResource,
    aws_s3 as s3,
    aws_iam as iam,
    aws_ec2 as ec2, // import ec2 library
    aws_eks as eks,
} from "aws-cdk-lib";
import { IVpc } from 'aws-cdk-lib/aws-ec2';
import { KubectlV24Layer } from '@aws-cdk/lambda-layer-kubectl-v24';

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

export interface EksClusterProps {
    readonly fakerApiUrl: string;
    readonly dbSecretName: string;
    readonly domainName: string;
    workshopVpc: IVpc;
    webSiteS3: s3.Bucket;
    dbSecurityGroup: ec2.SecurityGroup;
}

export class EksClusterStack extends Construct {

    readonly eksAlbAddressName: any

    constructor(scope: Construct, id: string, props: EksClusterProps) {
        super(scope, id);
        // Create the EKS Cluster
        const clusterAdminRole = new iam.Role(this, 'EKSWorkshopAdminRole', {
            assumedBy: new iam.AccountRootPrincipal(),
        });

        const cluster = new eks.Cluster(this, 'EKSCluster', {
            vpc: props.workshopVpc,
            vpcSubnets: [{ subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS }],
            mastersRole: clusterAdminRole,
            defaultCapacity: 1,
            defaultCapacityInstance: new ec2.InstanceType('m5.large'),
            version: eks.KubernetesVersion.V1_24, // If using containerD, you need set to V1_24
            kubectlLayer: new KubectlV24Layer(this, 'Kubectlv24Layer'),
            albController: {
                version: eks.AlbControllerVersion.V2_4_1,
            },
            clusterName: `Workshop-Cluster`,
            endpointAccess: eks.EndpointAccess.PUBLIC,
        });
        cluster.node.addDependency(props.workshopVpc)

        const s3BucketPolicy = new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
                's3:ListBucket',
            ],
            resources: [props.webSiteS3.bucketArn],
        });
        const s3ObjectPolicy = new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
                's3:GetBucketAcl',
                's3:PutObject',
                's3:GetObject',
                's3:DeleteObject',
                's3:PutObjectTagging',
                's3:GetObjectTagging',
                's3:DeleteObjectTagging',
                's3:GetLifecycleConfiguration',
                's3:PutLifecycleConfiguration',
            ],
            resources: [
                props.webSiteS3.bucketArn,
                props.webSiteS3.arnForObjects('*'),
            ],
        });

        cluster.defaultNodegroup!.role.attachInlinePolicy(
            new iam.Policy(this, 'EKSNodePolicy', {
                statements: [s3BucketPolicy, s3ObjectPolicy],
            })
        )
        cluster.defaultNodegroup!.role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('SecretsManagerReadWrite'));
        cluster.defaultNodegroup!.role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'));
        props.dbSecurityGroup.connections.allowFrom(cluster, ec2.Port.tcp(3306));

        const yaml = require('js-yaml');

        const javaYaml = yaml.loadAll(readFileSync(path.join(__dirname, "../manifest/cl-workshop-java.yaml")));
        cluster.addManifest('java', ...javaYaml);

        const ingressYaml = yaml.loadAll(readFileSync(path.join(__dirname, "../manifest/cl-workshop-ingress.yaml")));
        const ingressManifest = cluster.addManifest('ingress', ...ingressYaml);

        var nodeYamlString = readFileSync(path.join(__dirname, "../manifest/cl-workshop-e-commerce-svc.yaml"), 'utf8');
        nodeYamlString = nodeYamlString.replace('$CL_WORKSHOP_DB_SECRET_NAME', props.dbSecretName)
            .replace('$CL_REGION', Aws.REGION)
            .replace('$CL_CLOUDFRONT_DOMAIN_NAME', props.domainName);
        const nodeYaml = yaml.loadAll(nodeYamlString)
        cluster.addManifest('node', ...nodeYaml);

        var nginxYamlString = readFileSync(path.join(__dirname, "../manifest/cl-workshop-nginx-svc.yaml"), 'utf8');
        nginxYamlString = nginxYamlString.replace('$CL_WORKSHOP_DB_SECRET_NAME', props.dbSecretName)
            .replace('$CL_REGION', Aws.REGION)
            .replace('$CL_CLOUDFRONT_DOMAIN_NAME', props.domainName)
            .replace('$CL_LOG_GENERATOR_URL', props.fakerApiUrl);
        const nginxYaml = yaml.loadAll(nginxYamlString)
        cluster.addManifest('nginx', ...nginxYaml);

        ingressManifest.node.addDependency(cluster.albController!);
        ingressManifest.node.addDependency(props.workshopVpc)

        const eksAlbAddress = new eks.KubernetesObjectValue(this, 'EKSLoadBalancerAttribute', {
            cluster: cluster,
            objectType: 'ingress',
            objectNamespace: "default",
            objectName: 'server-ingress',
            jsonPath: '.status.loadBalancer.ingress[0].hostname', // https://kubernetes.io/docs/reference/kubectl/jsonpath/
        });

        this.eksAlbAddressName = eksAlbAddress.value
    }
}
