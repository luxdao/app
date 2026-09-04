# Building this

CI is Hanzo Git Actions on `git.hanzo.ai`, run by `act_runner`. Workflows live
in `.hanzo/workflows/`.

`.hanzo/workflows/image.yml` builds this source three times and publishes each
result to the registry of the org that runs it:

| Site | Image | Pinned by |
| --- | --- | --- |
| lux.vote | `ghcr.io/luxfi/vote` | `luxfi/universe` `deploy/lux-vote/lux-vote.yaml` |
| zoo.vote | `ghcr.io/zooai/vote` | `zooai/universe` `deploy/zoo-mainnet/zoo-vote.yaml` |
| hanzo.vote | `ghcr.io/hanzoai/vote` | `hanzoai/universe` `charts/app/values/hanzo/hanzo-vote.yaml` |

The credential the workflow logs in with pushes to all three orgs, so it belongs
to an account with `package:write` in luxfi, zooai and hanzoai. A refusal from
one registry fails that leg alone and the other two still publish.

pars.vote is served from a fork of this source and its image is that fork's.

To build by hand:

    docker build --build-arg VITE_VOTE_HOME=lux -t ghcr.io/luxfi/vote:lux-<sha> .

Two rules the deploy depends on:

- **Tag `<tenant>-<short sha>`, never a floating tag.** A declaration pins a
  version; `latest` on a registry makes "what is deployed" unanswerable.
- **Nothing deploys until a declaration names the tag.** An image published
  where no declaration reads is invisible.

`VITE_VOTE_HOME` names the tenant to be when the HOST names none — a preview
URL, a bare address, `localhost`. On the three live hosts the host settles it
and this value is never read; see the tenancy section of `LLM.md`.

It is checked twice on purpose: `vite.config.ts` refuses an unknown key at
configuration, `src/chrome/brand.tsx` throws at load. Neither may be dropped for
the other — the first turns a typo into a failed build instead of a blank page,
and the second is what the browser actually runs.
