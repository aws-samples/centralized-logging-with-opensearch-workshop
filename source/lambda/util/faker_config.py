patterns = {
    "cloudfront": '%timestamp\t%x-edge-location\t%sc-bytes\t%c-ip\t%cs-method\t%cs-host\t%cs-uri-stem\t'
                  '%sc-status\t%cs-referer\t%cs-user-agent\t%cs-uri-query\t%cs-cookie\t%x-edge-result-type\t'
                  '%x-edge-request-id\t%x-host-header\t%cs-protocol\t%cs-bytes\t%time-taken\t%x-forwarded-for\t'
                  '%ssl-protocol\t%ssl-cipher\t%x-edge-response-result-type\t%cs-protocol-version\t%fle-status\t '
                  '%fle-encrypted-fields\t%c-port\t%time-to-first-byte\t%x-edge-detailed-result-type\t'
                  '%sc-content-type\t%sc-content-len\t%sc-range-start\t%sc-range-end',
    "elf": '%h - - [%d %Z] "%m %U %H" %s %b "%R" "%u"',
    "clf": '%h - - [%d %Z] "%m %U %H" %s %b',
    "elf-vhost": '%v:%h - - [%d %Z] "%m %U %H" %s %b "%R" "%u"',
    "clf-vhost": '%v:%h - - [%d %Z] "%m %U %H" %s %b',
}

# Preview time in minutes
preview_time = 30

log_lines = 10000

output_name = "cloudfront_fake_log.gz"

region_ip_map = {
    'us-east-1': '54.242.0.0/15',
    'eu-west-1': '99.151.88.0/21',
    'eu-west-2': '18.168.0.0/14',
    'us-east-2': '52.15.0.0/16',
    'eu-central-1': '3.64.0.0/12',
    'eu-north-1': '13.48.0.0/15',
    'ap-southeast-2': '52.64.0.0/17',
    'sa-east-1': '54.94.0.0/16',
    'me-south-1': '52.95.228.0/24',
    'cn-north-1': '54.222.128.0/17',
    'ap-northeast-1': '18.178.0.0/16',
}