#!/usr/bin/env python3

import os
import re
import sys
import json
import glob
import subprocess


BUCKET_NAME = os.environ['BUCKET_NAME']
SOLUTION_NAME = os.environ['SOLUTION_NAME']
VERSION = os.environ['VERSION']

GLOBAL_S3_ASSETS_PATH = os.environ['GLOBAL_S3_ASSETS_PATH']
REGIONAL_S3_ASSETS_PATH = os.environ['REGIONAL_S3_ASSETS_PATH']


def sh(*args):
    return subprocess.call(*args, shell=True)


def flatten(t):
    return [item for sublist in t for item in sublist]


def get_assets(filename):
    with open(filename, 'r') as fp:
        assets = json.load(fp)
        files = assets['files']

        def _add_key(k, v):
            v['_id'] = k
            return v

        return [_add_key(k, v) for k, v in files.items()]


def fwrite(filename, data):
    with open(filename, 'w') as fp:
        fp.write(data)


def fread(filename):
    with open(filename, 'r') as fp:
        return fp.read()


def escstr(s):
    s = s.replace(r'$', r'\$')
    s = s.replace(r'.', r'\.')
    s = s.replace(r'{', r'\{')
    s = s.replace(r'}', r'\}')
    s = s.replace(r'[', r'\[')
    s = s.replace(r']', r'\]')
    return s


def rebucket(s, placeholder, new):
    pattern = r'"([^"]*)%s([^"]*)"' % escstr(placeholder)
    if '${' in placeholder:
        return re.sub(pattern, r'"\1%s-${AWS::Region}\2"' % new, s)
    return re.sub(pattern, r'{ "Fn::Sub": "\1%s-${AWS::Region}\2" }' % new, s)


def proc_tpl(fname, buckets, s3keys):
    data = fread(fname)

    for bkt in buckets:
        data = rebucket(data, bkt, BUCKET_NAME)

    for key in s3keys:
        data = data.replace(key, '{name}/{version}/{key}'.format(
            name=SOLUTION_NAME,
            version=VERSION,
            key=key,
        ))

    j = json.loads(data)
    if j.get('Parameters') and j['Parameters'].get('BootstrapVersion'):
        del j['Parameters']['BootstrapVersion']

    if j.get('Rules') and j['Rules'].get('CheckBootstrapVersion'):
        del j['Rules']['CheckBootstrapVersion']

    return json.dumps(j, indent=2)


def main():
    dir_in = os.path.abspath(sys.argv[1])
    assets = glob.glob(os.path.join(dir_in, '*.assets.json'))

    s3assets = get_assets(assets[0])
    # s3assets = list(filter(lambda x: x['source']['packaging'] == 'zip', s3assets))
    destinations = list(map(lambda x: x['destinations'], s3assets))

    buckets = map(lambda x: [each['bucketName'] for each in x.values()], destinations)
    buckets = set(flatten(buckets))

    s3keys = map(lambda x: [each['objectKey'] for each in x.values()], destinations)
    s3keys = set(flatten(s3keys))

    templates = glob.glob(os.path.join(dir_in, '*.template.json'))
    templates = filter(lambda x: not x.endswith('nested.template.json'), templates)

    # replace
    for tpl in templates:
        dest = os.path.abspath(os.path.join(GLOBAL_S3_ASSETS_PATH, os.path.basename(tpl)))
        print('write %s' % dest)
        fwrite(dest, proc_tpl(tpl, buckets, s3keys))

    for asset in s3assets:
        src = os.path.join(dir_in, os.path.basename(asset['source']['path']))
        dst = os.path.abspath(os.path.join(REGIONAL_S3_ASSETS_PATH,
                                           next(iter(asset['destinations'].values()))['objectKey']))
        if asset['source']['packaging'] == 'zip':
            cmdline = 'cd {} && zip -r {} .'.format(src, dst)
            print('archive %s' % dst)
            sh(cmdline)
        else:
            if src.endswith('template.json'):
                print('write %s' % dst)
                fwrite(dst, proc_tpl(src, buckets, s3keys))
            else:
                print('copy to %s' % dst)
                sh('cp -v {} {}'.format(src, dst))


if __name__ == '__main__':
    main()
