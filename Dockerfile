FROM node:20-alpine AS development

ENV TZ=America/Bogota
RUN apk add --no-cache tzdata

WORKDIR /usr/src/app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
