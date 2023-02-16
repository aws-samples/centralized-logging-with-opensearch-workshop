# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: Apache-2.0


import json
import boto3
import os
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

alb_dns_names = os.environ.get('ALB_DNS_NAMES')
waf_acl_arn = os.environ.get('WAF_ACL_ARN')

waf_client = boto3.client('wafv2')
elbv2_client = boto3.client('elbv2')


def lambda_handler(event, _):
    logger.info(event)
    request_type = event["RequestType"]
    if request_type == "Create" or request_type == "Update":
        return associate_web_acl()
    if request_type == "Delete":
        return disassociate_web_acl()
    raise Exception("Invalid request type: %s" % request_type)


def associate_web_acl():
    # Associate the ALB with the WAF
    load_balancer_arns = get_alb_arn_by_dns(alb_dns_names)
    
    for load_balancer_arn in load_balancer_arns:
        try:
            waf_client.associate_web_acl(
                WebACLArn=waf_acl_arn,
                ResourceArn=load_balancer_arn
            )

            logger.info(f'Associate ALB {load_balancer_arn} to WAF {waf_acl_arn} success!')
        except Exception as e:
            logger.info(f'Associate ALB {load_balancer_arn} to WAF {waf_acl_arn} failed!')
            logger.exception(e)

    return {
        "statusCode": 200,
        "body": json.dumps(f'Associate ALB {load_balancer_arns} to WAF {waf_acl_arn} success!'),
    }

def disassociate_web_acl():
    # Disassociate the ALB with the WAF
    load_balancer_arns = get_alb_arn_by_dns(alb_dns_names)

    for load_balancer_arn in load_balancer_arns:
        try:
            waf_client.disassociate_web_acl(
                ResourceArn=load_balancer_arn
            )

            logger.info(f'Disassociate ALB {load_balancer_arn} from WAF {waf_acl_arn} success!')
        except Exception as e:
            logger.info(f'Disassociate ALB {load_balancer_arn} from WAF {waf_acl_arn} failed!')
            logger.exception(e)

    return {
        "statusCode": 200,
        "body": json.dumps(f'Disassociate ALB {load_balancer_arns} from WAF {waf_acl_arn} success!'),
    }

def get_alb_arn_by_dns(alb_dns_names):
    # Get a list of all the available load balancers
    load_balancer_arns = []
    response = elbv2_client.describe_load_balancers()

    # Search for the load balancer with the specified DNS name
    for lb in response['LoadBalancers']:
        if lb['DNSName'] in alb_dns_names.split(','):
            alb_arn = lb['LoadBalancerArn']
            load_balancer_arns.append(alb_arn)
    return load_balancer_arns
        