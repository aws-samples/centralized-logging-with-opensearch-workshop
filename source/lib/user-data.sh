#!/bin/bash

sudo su
yum update -y
amazon-linux-extras install -y nginx1 java-openjdk11
yum install -y mysql

## Install Node and npm
curl -sL https://raw.githubusercontent.com/nvm-sh/nvm/v0.34.0/install.sh| bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm install v17

mkdir -p /var/www/inc
mkdir -p /var/www/ui
mkdir -p /var/www/server

## Run Java app
wget https://d1ghg1dwyjumec.cloudfront.net/petstore-0.0.1-SNAPSHOT.jar
nohup java -jar petstore-0.0.1-SNAPSHOT.jar &