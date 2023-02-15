#!/bin/sh

set -e

cd /tmp
wget https://aws-gcr-solutions.s3.amazonaws.com/log-hub-workshop/v1.0.0/petstore-0.0.1-SNAPSHOT.jar
mkdir -p /var/log/spring-boot/

java -jar petstore-0.0.1-SNAPSHOT.jar --server.port=8080 | tee /var/log/spring-boot/access.log