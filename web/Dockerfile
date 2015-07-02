# web
FROM node:latest
MAINTAINER simon@ifwe.co

ENV NODE_ENV production
RUN echo "deb http://www.deb-multimedia.org stable main non-free" > /etc/apt/sources.list.d/debian-multimedia.list

ADD ./ /usr/local/src/web/
RUN apt-get -y update
RUN apt-get install -y imagemagick && apt-get install -y graphicsmagick
RUN apt-get install -y libcairo2-dev  libjpeg62-turbo-dev libpango1.0-dev libgif-dev build-essential g++
RUN apt-get install --force-yes -y cimg-dev  libmagickcore-dev libsndfile1-dev libsamplerate0-dev libmpg123-dev libavcodec-dev
WORKDIR /usr/local/src/web/builds/pHash-0.9.6
RUN ./configure && make && make install && ldconfig /usr/local/lib

WORKDIR /usr/local/src/web/
RUN  rm -rf  /usr/local/src/web/node_modules && npm install
CMD npm start