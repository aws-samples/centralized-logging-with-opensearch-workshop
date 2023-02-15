FROM amazonlinux:latest

RUN yum update -y && yum install -y awscli mysql
RUN amazon-linux-extras install -y nginx1
RUN curl -sL https://rpm.nodesource.com/setup_16.x | bash -
RUN yum install -y nodejs

ENV CL_WORKSHOP_DB_SECRET_NAME ''
ENV CL_REGION ''
ENV CL_CLOUDFRONT_DOMAIN_NAME ''
ENV CL_LOG_GENERATOR_URL ''


COPY /simple-app/ui /var/www/ui
COPY /simple-app/server /var/www/server
RUN sed -i "s/OpenSearch Workshop/OpenSearch Workshop (EKS)/" /var/www/ui/public/index.html
RUN sed -i "s/OpenSearch Workshop/OpenSearch Workshop (EKS)/" /var/www/ui/src/pages/common/Nav.tsx

WORKDIR /var/www/ui
RUN cd /var/www/ui
RUN npm install && npm run build
RUN yes | cp -r /var/www/ui/build/* /usr/share/nginx/html/

COPY /ecr/nginx-svc/start.sh .
RUN chmod +x start.sh
CMD ["sh", "start.sh"]