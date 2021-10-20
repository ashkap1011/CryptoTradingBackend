FROM node:14-slim

WORKDIR /usr/src/app

COPY ./package*.json ./

COPY tsconfig*.json ./

COPY src ./src

RUN npm install

COPY . .

ENV NODE_PATH=./build

RUN npm run build

RUN ls -a

##USER node

EXPOSE 3000

CMD ["npm" , "start"]



