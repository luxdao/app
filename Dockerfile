# The image lux.vote runs.
#
# Two stages: build the bundle, then serve it. Nothing in the second stage can
# build, so a container that starts is a container whose bundle already exists.
#
# `serve` rather than a reverse proxy: this is a static bundle behind
# hanzoai/ingress, which terminates TLS and routes. A proxy in here would be a
# second one nobody configured.

FROM node:20-alpine AS builder
RUN apk add --no-cache git && npm install -g pnpm@9
WORKDIR /src

# The engine resolves its subpackages against a flat tree. Without this the
# install succeeds and the build fails somewhere unrelated.
COPY .npmrc ./
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

# Off by default in this image as it is in the dev build. @hanzo/gui depends on
# @hanzogui/telemetry, which posts to api.hanzo.ai on load; a governance
# interface should not report who read it.
ARG VITE_HANZO_TELEMETRY=off
ENV VITE_HANZO_TELEMETRY=$VITE_HANZO_TELEMETRY

# Which DAO this image is. The same source builds lux.vote and zoo.vote; an
# unknown key fails the build rather than shipping a site that opens on the
# wrong chain and reports real figures about somebody else's governance.
ARG VITE_VOTE_HOME=lux
ENV VITE_VOTE_HOME=$VITE_VOTE_HOME

RUN NODE_OPTIONS=--max-old-space-size=8192 pnpm exec vite build

FROM node:20-alpine AS production
RUN npm install -g serve
WORKDIR /app
COPY --from=builder /src/dist ./dist
EXPOSE 3000

# -s so a deep link resolves: every route is client-side, and without it
# /proposals/4 is a 404 from the file server rather than a screen.
CMD ["serve", "-s", "dist", "-l", "3000"]
