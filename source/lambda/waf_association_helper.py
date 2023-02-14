# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: Apache-2.0


import json
import boto3
import os
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

alb_dns_name = os.environ.get('ALB_DNS_NAME')
waf_acl_arn = os.environ.get('WAF_ACL_ARN')

waf_client = boto3.client('wafv2')
elbv2_client = boto3.client('elbv2')


def lambda_handler(event, _):
    logger.info(event)
    request_type = event["RequestType"]
    if request_type == "Create" or request_type == "Update":
        return on_create(event)
    raise Exception("Invalid request type: %s" % request_type)


def on_create(_):
    # Associate the ALB with the WAF
    load_balancer_arn = get_alb_arn_by_dns(alb_dns_name)

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
        "body": json.dumps(f'Associate ALB {load_balancer_arn} to WAF {waf_acl_arn} success!'),
    }

def get_alb_arn_by_dns(alb_dns_name):
    # Get a list of all the available load balancers
    response = elbv2_client.describe_load_balancers()

    # Search for the load balancer with the specified DNS name
    for lb in response['LoadBalancers']:
        if lb['DNSName'] == alb_dns_name:
            alb_arn = lb['LoadBalancerArn']
            return alb_arn
    else:
        logger.info(f'ALB with DNS name "{alb_dns_name}" not found.')
        raise Exception(f'ALB with DNS name "{alb_dns_name}" not found.')
        