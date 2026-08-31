# Building this

CI is Hanzo Git Actions on `git.hanzo.ai`, run by `act_runner`. Workflows live
in `.hanzo/workflows/`.

`.hanzo/workflows/image.yml` publishes `ghcr.io/luxfi/vote`. Zoo's image is
`ghcr.io/zooai/vote`, built by `zooai/vote` from this same source — each org's
images live in its own registry, so an org losing access cannot strand another's
deploy.

To build by hand:

    docker build --build-arg VITE_VOTE_HOME=lux -t ghcr.io/luxfi/vote:lux-<sha> .

Two rules the deploy depends on:

- **Tag `<brand>-<short sha>`, never a floating tag.** A declaration pins a
  version; `latest` on a registry makes "what is deployed" unanswerable.
- **Nothing deploys until a manifest names the tag.** `luxfi/universe`
  `deploy/lux-vote/lux-vote.yaml` pins Lux's. An image published where no
  declaration reads is invisible.

`VITE_VOTE_HOME` is checked twice on purpose: `vite.config.ts` refuses an unknown
venue at configuration, `src/gov/chain.ts` throws at load. Neither may be dropped
for the other — a build that opened on the wrong chain would ship a Zoo site
reading Lux's governor, every figure real and about the wrong DAO.
