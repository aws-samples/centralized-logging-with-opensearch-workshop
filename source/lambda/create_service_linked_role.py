# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: Apache-2.0

import boto3
import logging
import time

iam = boto3.client("iam")

logger = logging.getLogger()
logger.setLevel(logging.INFO)


def lambda_handler(event, context):
    request_type = event["RequestType"]
    if request_type == "Create" or request_type == "Update":
        try:
            iam.get_role(
                RoleName="AWSServiceRoleForAmazonElasticsearchService",
            )
            logger.info("AWSServiceRoleForAmazonElasticsearchService already exists.")

        except Exception as err:
            logger.error(err)
            logger.info("Create service linked role AWSServiceRoleForAmazonElasticsearchService.")
            resp = iam.create_service_linked_role(AWSServiceName="es.amazonaws.com")
            if "Role" in resp and "Arn" in resp["Role"]:
                logger.info("Create AWSServiceRoleForAmazonElasticsearchService completed.")
            # After created, it can't be used immediately.
            time.sleep(5)

    return "OK"
