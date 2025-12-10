FROM node:24-alpine AS builder

WORKDIR /app

ARG host
ENV VITE_MEDIA_SERVER_HOST=$host

ARG relay
ENV VITE_RELAY_SERVER_HOST=$relay

COPY . .

RUN yarn config set network-timeout 300000
RUN yarn install --frozen-lockfile
# RUN yarn add --dev eslint-config-react-app
# RUN yarn add --dev eslint-plugin-import
RUN yarn build

FROM nginx:stable-alpine

COPY --from=builder /app/build /usr/share/nginx/html
COPY ./nginx.conf /etc/nginx/nginx.conf
EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]
