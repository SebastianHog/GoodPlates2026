# Build the Nuxt app, then run only the built server (.output) in a small image
FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
# postinstall (nuxt prepare) needs the source, the build below does that step anyway
RUN npm ci --ignore-scripts
COPY . .
# Which code this is, shown on /version (.git isn't copied in, so CI passes it)
ARG GIT_COMMIT=""
ARG BUILD_VERSION=""
RUN npm run build

FROM node:22-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
COPY --from=build /app/.output ./.output
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
