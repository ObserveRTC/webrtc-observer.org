FROM node:22-alpine
RUN apk add --no-cache python3 py3-pip make cmake linux-headers g++ \
    && ln -sf python3 /usr/bin/python

WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn
COPY . .
RUN yarn build
# ENV DEBUG="mediasoup*"
CMD ["node", "lib/main.js"]
