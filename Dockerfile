FROM node:14

COPY ./express_serv /gg-struggle/
COPY ./express_serv/* /gg-struggle/

WORKDIR /gg-struggle/

RUN cd /gg-struggle/ &&  mkdir /gg-struggle/dumps && npm install

EXPOSE 443

CMD [ "node", "." ]
