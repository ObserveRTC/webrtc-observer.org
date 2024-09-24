FROM node:20-alpine

WORKDIR /app

COPY package.json yarn.lock .

RUN rm -rf /app/node_modules

RUN yarn

COPY . .

RUN yarn add esbuild

EXPOSE 3000

CMD ["yarn", "run", "dev", "--host"]