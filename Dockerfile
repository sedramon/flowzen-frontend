# Build Stage
FROM node:20-alpine AS angular

WORKDIR /app

COPY . .
RUN yarn install
RUN yarn build

# ── Run Stage ────────────────────────────────────
FROM httpd:alpine3.15

# 1) remove Apache’s defaults
RUN rm -rf /usr/local/apache2/htdocs/*

# 2) copy *just the contents* of the browser/ folder
#    into the webroot so index.html lives at htdocs/index.html
COPY --from=angular /app/dist/flowzen-frontend/browser/. /usr/local/apache2/htdocs/

# Apache’s default port
EXPOSE 80

# start in foreground
CMD ["httpd-foreground"]
