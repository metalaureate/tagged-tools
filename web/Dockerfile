# web
FROM node:latest
MAINTAINER simon@ifwe.co

ENV NODE_ENV production

ADD ./ /usr/local/src/web/
RUN apt-get -y update && \
    apt-get -y install postgresql-client
WORKDIR /usr/local/src/web/
RUN  rm -rf  /usr/local/src/web/node_modules && npm install
CMD npm start