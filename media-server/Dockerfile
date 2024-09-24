FROM node:18-alpine
RUN apk add --no-cache python3 py3-pip make cmake linux-headers g++ \
    && ln -sf python3 /usr/bin/python

WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn
COPY . .
RUN yarn build
CMD ["node", "lib/main.js"]
