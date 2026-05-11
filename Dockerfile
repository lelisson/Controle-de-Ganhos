# Build PWA estático e sirva com Nginx; API em outro container.
FROM node:20-alpine AS web-build
WORKDIR /web
COPY medidor-ganho/package*.json ./
RUN npm ci
COPY medidor-ganho/ ./

ARG EXPO_PUBLIC_API_URL=
ARG EXPO_PUBLIC_SKIP_PAYWALL=0
ARG EXPO_PUBLIC_SHOW_TEST_HINT=0
ARG EXPO_PUBLIC_CHECKOUT_URL=

ENV EXPO_PUBLIC_API_URL=$EXPO_PUBLIC_API_URL
ENV EXPO_PUBLIC_SKIP_PAYWALL=$EXPO_PUBLIC_SKIP_PAYWALL
ENV EXPO_PUBLIC_SHOW_TEST_HINT=$EXPO_PUBLIC_SHOW_TEST_HINT
ENV EXPO_PUBLIC_CHECKOUT_URL=$EXPO_PUBLIC_CHECKOUT_URL

RUN npx expo export --platform web

FROM nginx:1.27-alpine
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=web-build /web/dist /usr/share/nginx/html
COPY --from=web-build /web/public/icon-192.png /usr/share/nginx/html/icon-192.png
COPY --from=web-build /web/public/icon-512.png /usr/share/nginx/html/icon-512.png
EXPOSE 80
