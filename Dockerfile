FROM node:alpine as build-stage
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine as production-stage
COPY --from=build-stage /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
RUN set -eux; \
    if apk info -e curl >/dev/null 2>&1; then apk del --no-cache curl; fi; \
    if apk info -e libcurl >/dev/null 2>&1; then apk del --no-cache libcurl; fi
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
