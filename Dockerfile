FROM node:14

COPY ./express_serv /gg-struggle/
COPY ./express_serv/* /gg-struggle/

WORKDIR /gg-struggle/

RUN cd /gg-struggle/;  npm install

EXPOSE 3000

CMD [ "node", "http.js" ]
