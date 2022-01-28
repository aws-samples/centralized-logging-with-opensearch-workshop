from util.log_generator import FakeLogs
from util.line_pattern import LinePattern
from util.tools import upload_folder_to_s3
import util.faker_config as config
import time
import json
import os

import boto3

# Get S3 resource
s3 = boto3.resource('s3')
log_bucket_name = os.environ.get('DEFAULT_LOG_S3_BUCKET_NAME')
log_bucket_prefix = os.environ.get('DEFAULT_LOG_S3_BUCKET_PREFIX')

log_types = ['cloudfront', 'nginx', 'apache']

def lambda_handler(event, context):  
    file_format = event['pathParameters']['logType']
    if file_format in log_types:
        start_time = time.time()
        line_pattern = LinePattern(None, date_pattern="%Y-%m-%d\t%H:%M:%S", file_format="cloudfront")
        FakeLogs(
            filename="/tmp/fake_logs/" + config.output_name,
            num_lines=config.log_lines,
            line_pattern=line_pattern,
            file_format=file_format
        ).run()
        end_time = time.time()
        print("Finish generate %d lines log in %f secs" % (config.log_lines, end_time - start_time))
        s3_bucket = s3.Bucket(log_bucket_name)
        upload_folder_to_s3(s3_bucket, "/tmp/fake_logs", log_bucket_prefix)
        return respond(None, "Success")
    else:
        return respond(ValueError('Unsupported log type "{}"'.format(file_format)))
    

def respond(err, res=None):
    return {
        'statusCode': '400' if err else '200',
        'body': str(err) if err else json.dumps(res),
        'headers': {
            'Content-Type': 'application/json',
        },
    }