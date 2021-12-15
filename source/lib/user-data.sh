#!/bin/bash

sudo su
yum update -y
yum install -y httpd
yum install -y mysql
amazon-linux-extras install -y lamp-mariadb10.2-php7.2 php7.2

systemctl start httpd
systemctl enable httpd

mkdir -p /var/www/inc

echo "<h1>Hello World from $(hostname -f)</h1>" > /var/www/html/index.html
