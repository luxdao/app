# lux.vote — Lux DAO governance SPA (pre-built static: index.html + assets/).
# Served by hanzoai/spa (same runner image as the other lux-apps SPAs).
# No build step: the production bundle is committed at the repo root with
# absolute /assets/ paths, so we copy it straight into the static root.
FROM ghcr.io/hanzoai/spa:sha-b9d3a13-amd64
COPY . /public
ENV PORT=3000
ENV ROOT=/public
EXPOSE 3000
