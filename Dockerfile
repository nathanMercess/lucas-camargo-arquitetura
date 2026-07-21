# syntax=docker/dockerfile:1

FROM node:24-alpine AS build

WORKDIR /app

RUN corepack enable && corepack prepare yarn@1.22.22 --activate

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --non-interactive

COPY . .
RUN yarn build --configuration production

FROM nginxinc/nginx-unprivileged:stable-alpine

ENV CONTENT_BASE_URL=/content \
  NGINX_ENVSUBST_FILTER=CONTENT_BASE_URL \
  NGINX_ENVSUBST_OUTPUT_DIR=/usr/share/nginx/html/runtime

COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY deploy/runtime-config.js.template /etc/nginx/templates/runtime-config.js.template
COPY --from=build --chown=101:101 /app/dist/lucas-camargo-arquitetura/browser/ /usr/share/nginx/html/

EXPOSE 8080

USER 101:101
