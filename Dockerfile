FROM node:14

WORKDIR ./express_serv

copy package*.json ./

run npm install

EXPOSE 3000

CMD [ "node", "https.js" ]
