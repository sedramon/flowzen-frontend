# Build stage
FROM node:20-alpine as build

WORKDIR /usr/local/app

COPY ./ /usr/local/app/

RUN yarn install

RUN yarn build

# Run stage
FROM nginx:alpine

COPY --from=build /usr/local/app/dist/flowzen-frontend/browser /usr/share/nginx/html

EXPOSE 80