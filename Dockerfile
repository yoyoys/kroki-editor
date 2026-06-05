# build — runs on the builder's native arch; the static output is arch-independent,
# so multi-arch builds don't pay for emulated Node runs.
FROM --platform=$BUILDPLATFORM node:24-alpine AS build
RUN corepack enable
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
# --ignore-scripts is safe: esbuild/rolldown ship platform binaries via optionalDependencies,
# and it lets the install run non-interactively (no build-approval prompt).
RUN pnpm install --frozen-lockfile --ignore-scripts
COPY . .
RUN node_modules/.bin/vue-tsc -b && node_modules/.bin/vite build

# runtime
FROM nginx:alpine
LABEL org.opencontainers.image.title="Kroki Editor" \
      org.opencontainers.image.description="A fast, mobile-friendly web editor for Kroki diagrams." \
      org.opencontainers.image.source="https://github.com/yoyoys/kroki-editor" \
      org.opencontainers.image.url="https://github.com/yoyoys/kroki-editor" \
      org.opencontainers.image.licenses="Apache-2.0"
RUN apk add --no-cache gettext
COPY --from=build /app/dist /usr/share/nginx/html
COPY docker/config.js.template /usr/share/nginx/html/config.js.template
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
EXPOSE 80
ENTRYPOINT ["/entrypoint.sh"]
