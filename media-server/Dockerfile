FROM node:22-alpine AS builder

WORKDIR /app

RUN apk add --no-cache python3 py3-pip make cmake linux-headers g++ \
    && ln -sf python3 /usr/bin/python
COPY . .
RUN yarn && yarn build
RUN npm prune


FROM node:22-alpine AS base

WORKDIR /app
COPY --from=builder /app /app
# ENV DEBUG="mediasoup*"
CMD ["node", "lib/main.js"]
