# vote — RETIRED

**lux.vote is built from [`luxfi/dao`](https://github.com/luxfi/dao). Nothing is built here.**

This repo held a hand-committed static build of the governance app plus a `CNAME`
claiming `lux.vote` and a GitHub Pages workflow. It was neither the source nor the
thing serving the domain, which made it a duplicate that could only ever drift —
and, because of the `CNAME`, one that could take the domain over if Pages were
ever enabled. Both are now removed.

## Where governance actually lives

| Concern | Home |
| --- | --- |
| App source | [`luxdao/app`](https://github.com/luxdao/app), the `app` submodule of `luxfi/dao` |
| Governance contracts | [`luxdao/contracts`](https://github.com/luxdao/contracts) and `luxfi/standard` `contracts/governance/` |
| Build + publish | `luxfi/dao` `.github/workflows/vote.yml` → `ghcr.io/luxfi/dao-vote` |
| Brands | one app, white-labelled by hostname: `lux.vote` · `zoo.vote` · `pars.vote` |

## Why it was dead, measured

The bundle committed here was already stale. Its `index.html` referenced
`assets/index-CPDstpja.js`; the live site referenced `assets/index-zWQb2CFA.js`.
Requesting the committed asset from lux.vote returned `200` — but with
`content-type: text/html` and 3248 bytes, byte-identical to the response for a
deliberately bogus path. That is the SPA fallback, not the asset. The commit here
had not been what serves lux.vote for some time.

`vote.lux.network`, a separate Pars-branded SPA that advertised undeployed
Governor and vLUX addresses, is likewise retired and 308-redirects here.

## If you are looking for the old build

It is in this repo's history. Do not restore it — rebuild from `luxfi/dao` instead.
