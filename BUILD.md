# Building this

**Not GitHub Actions.** The estate's CI is native — `ci.hanzo.ai` builds,
`cd.hanzo.ai` delivers, and `git.hanzo.ai` is the canonical forge with GitHub as
a mirror. The GitHub Actions runners are gone: measured 2026-08-30, zero runners
across `luxfi`, `zooai` and `hanzoai`, and the last green Actions run anywhere in
the estate was 2026-07-27. A workflow under `.github/` here would queue forever
and look like it was working.

`Dockerfile` is the whole of what a builder needs:

    docker build --build-arg VITE_VOTE_HOME=lux -t ghcr.io/luxfi/vote:lux-<sha> .
    docker build --build-arg VITE_VOTE_HOME=zoo -t ghcr.io/zooai/vote:zoo-<sha> .

Two rules the deploy depends on:

- **Tag `<brand>-<short sha>`, never a floating tag.** A declaration pins a
  version; `latest` on a registry makes "what is deployed" unanswerable.
- **Each org's images go to its own registry.** Lux to `ghcr.io/luxfi/*`, Zoo to
  `ghcr.io/zooai/*`. Mixing them means one org losing access strands another
  org's deploy.

Nothing deploys until a manifest names the tag. `luxfi/universe`
`deploy/lux-vote/lux-vote.yaml` pins Lux's. A build that publishes where no
declaration reads is invisible: that is exactly what happened for six weeks when
the old workflow pushed to `ghcr.io/luxfi/dao-vote`, which nothing pulled — CI
green, registry filling, cluster unchanged.

`VITE_VOTE_HOME` is checked twice on purpose. `vite.config.ts` refuses an unknown
venue at configuration; `src/gov/chain.ts` throws at load. Neither may be dropped
for the other — a build that quietly opened on the wrong chain would ship a Zoo
site reading Lux's governor, every figure real and about the wrong DAO.
