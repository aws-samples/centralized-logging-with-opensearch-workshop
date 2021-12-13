#!/bin/bash

sudo su
yum update -y
yum install -y httpd
yum install -y mysql
amazon-linux-extras install -y lamp-mariadb10.2-php7.2 php7.2

systemctl start httpd
systemctl enable httpd

mkdir -p /var/www/inc
myValue=$(aws secretsmanager get-secret-value --secret-id logHubWorkshopSecret --query SecretString --output text --region us-east-1)
echo "$myValue" > /var/www/inc/dbinfo.txt

echo "<h1>Hello World from $(hostname -f)</h1>" > /var/www/html/index.html
