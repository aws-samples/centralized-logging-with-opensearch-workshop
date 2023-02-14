FROM amazonlinux:latest

RUN yum update -y && yum install -y awscli mysql
RUN curl -sL https://rpm.nodesource.com/setup_17.x | bash -
RUN yum install -y nodejs

ENV CL_WORKSHOP_DB_SECRET_NAME ''
ENV CL_REGION ''
ENV CL_CLOUDFRONT_DOMAIN_NAME ''

COPY /simple-app/server /var/www/server

COPY /ecr/e-commerce-svc/start.sh .
RUN chmod +x start.sh
CMD ["sh", "start.sh"]