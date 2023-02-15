#!/bin/sh

set -e

mkdir /var/www/inc/

echo $(aws secretsmanager get-secret-value --secret-id $CL_WORKSHOP_DB_SECRET_NAME --query SecretString --output json --region $CL_REGION) > /var/www/inc/dbinfo.json
echo 'var a  = JSON.parse(require("/var/www/inc/dbinfo.json"));    var b = require("/var/www/server/ormconfig.json");    var output = Object.assign({}, b, a);    output.database = a.dbname;    var fs = require("fs");    fs.writeFile("/var/www/server/ormconfig.json", JSON.stringify(output), function(err){});' > mergeDBInfo.js

node mergeDBInfo.js

sed -i "s/\$WORKSHOP_CDN_DOMAIN/$CL_CLOUDFRONT_DOMAIN_NAME/" /var/www/server/src/controllers/mockdata.ts

cd /var/www/server/
npm install && npm run start