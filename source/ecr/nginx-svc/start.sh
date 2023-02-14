#!/bin/sh

set -e

sed -i "s/\$WORKSHOP_CDN_DOMAIN/$CL_CLOUDFRONT_DOMAIN_NAME/" /var/www/server/src/controllers/mockdata.ts
echo "{\"fakerAPIUrl\":\"$CL_LOG_GENERATOR_URL\"}" > /usr/share/nginx/html/config.json

cat > /etc/nginx/nginx.conf <<EOF
user nginx;
worker_processes auto;
error_log /dev/stdout;
pid /run/nginx.pid;

include /usr/share/nginx/modules/*.conf;

events {
    worker_connections 1024;
}
    
http {
    log_format  main  '\$remote_addr - \$remote_user [\$time_local] "\$request" '
                      '\$status \$body_bytes_sent "\$http_referer" '
                      '"\$http_user_agent" "\$http_x_forwarded_for"';

    access_log  /dev/stdout  main;
    
    sendfile            on;
    tcp_nopush          on;
    tcp_nodelay         on;
    keepalive_timeout   65;
    types_hash_max_size 4096;
    
    include             /etc/nginx/mime.types;
    default_type        application/octet-stream;
    
    include /etc/nginx/conf.d/*.conf;
    
    server {
        listen       80;
        listen       [::]:80;
        server_name  _;
        root         /usr/share/nginx/html;
    
        include /etc/nginx/default.d/*.conf;
    
    
        location = /404.html {
        }
    
        error_page 500 502 503 504 /50x.html;
        location = /50x.html {
        }
    
        location / {
                try_files \$uri /index.html;
        }
    
        location /api/ {
                rewrite ^/api/(.*)\$ /\$1 break;
                proxy_pass http://e-commerce.default.svc.cluster.local;
        }
    
        location /java/ {
                rewrite ^/java/(.*)\$ /\$1 break;
                proxy_pass http://java-svc.default.svc.cluster.local;
        }
        }
}
EOF
nginx -g "daemon off;"