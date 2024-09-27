FROM node:18-bullseye-slim as builder

WORKDIR /app

ARG host
ENV VITE_MEDIA_SERVER_HOST=$host

COPY . .

RUN yarn config set network-timeout 300000 
RUN yarn install --frozen-lockfile
# RUN yarn add --dev eslint-config-react-app
# RUN yarn add --dev eslint-plugin-import
RUN yarn build

FROM nginx:stable-alpine

COPY --from=builder /app/build /usr/share/nginx/html
COPY ./nginx.conf /etc/nginx/nginx.conf
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]