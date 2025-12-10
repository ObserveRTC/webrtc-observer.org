FROM node:24-alpine3.22 AS builder

WORKDIR /app

RUN apk add --no-cache python3 py3-pip make cmake linux-headers g++
COPY . .
RUN yarn && yarn build
RUN npm prune


FROM node:24-alpine3.22 AS base

WORKDIR /app
COPY --from=builder /app /app
# ENV DEBUG="mediasoup*"
CMD ["node", "lib/main.js"]
