# LLM.md — vote

What the next agent needs and cannot get from the source alone.

## What this repository is

The lux.vote governance interface, built fresh on `@hanzo/gui` and `@hanzogui/*`.
It replaces an app derived from Decent DAO under AGPL-3.0; nothing here descends
from it. Its route table was read to enumerate what the interface must do, and
nothing else was taken.

This repo was retired on 2026-07-27 because it held a hand-committed static
build and a `CNAME` that could seize the domain. **Do not commit a bundle and do
not add a CNAME.** `dist/` is ignored.

## The stack, and why there is no Tailwind

`@hanzogui/*` leaf packages for every primitive, `@hanzo/ui/grid` for layout,
`@hanzo/design` + `@hanzo/font` for the ramp and the face. Styling is style
props; `className` appears nowhere in `src/`.

`@luxfi/ui` is **not** a dependency. Its prebuilt components carry Tailwind
arbitrary-utility class strings and need `@source` pointed at its `dist`, which
is the only reason the exchange carries Tailwind at all. Nothing in
`@hanzo/gui`, `@hanzogui/*`, `@hanzo/ui` or `@luxwallet/ui` lists `tailwindcss`
anywhere, so dropping `@luxfi/ui` drops the whole framework. The cost is that
`@luxfi/ui`'s `AppProvider` and its `luxUi()` vite plugin had to be replaced:

- **`createGui`** — `src/chrome/gui.ts`. `GuiProvider` alone is not enough. Every
  styled component resolves tokens through a configuration created before the
  first one renders; without it the tree throws `Haven't called createGui yet`
  and the document is blank. `getDefaultGuiConfig('web')` from
  `@hanzogui/config-default`.
- **`luxUi()`** — replaced in `vite.config.ts` by the alias `react-native` →
  `react-native-web` plus a `dedupe` list read from `node_modules/@hanzogui` at
  config time, so a package added by an upgrade is deduplicated without anyone
  remembering to add it.

`.npmrc` sets `node-linker=hoisted`. The `@hanzo/gui` umbrella resolves its
subpackages against a flat tree and fails at install rather than at build.

Telemetry is off. `@hanzo/gui` depends on `@hanzogui/telemetry`, which posts to
`api.hanzo.ai/v1/event` on load by default. `VITE_HANZO_TELEMETRY: 'off'` is set
in the vite `define` block — visible in the build, and not losable with a `.env`.

## A tenant is not a chain

Two questions that look like one and are not:

- **Which chains can be read.** `src/gov/chain.ts` `VENUES` — Lux 96369, Zoo
  200200, Pars 494949, Hanzo 36963, plus a loopback node under `import.meta.env.DEV`.
  Every one of them is reachable from every site through the picker in the
  header, so the deployment survey can compare four chains against the records.
- **Which sites this bundle serves.** `src/chrome/brand.tsx` `BRANDS` — lux,
  zoo, hanzo. Each names its chain, its mark, and the word beside the mark.

`HOME` — the chain a site opens on — is exported from `brand.tsx`, not from
`chain.ts`, because it is an answer to the second question. **Do not export it
from `chain.ts` again**: `brand.tsx` imports `venue()` from `chain.ts`, so a
re-export the other way is a cycle, and in ESM the re-export is hoisted, which
means `brand.tsx` evaluates first and reads `VENUES` in its temporal dead zone.
That fails as `ReferenceError` at load, in the browser, on every screen.

**The host names the tenant, and `VITE_VOTE_HOME` is only the fallback.** Every
label of the hostname is checked against `BRANDS`, so `lux.vote`,
`www.hanzo.vote` and `vote.zoo.network` all land on the right DAO from one
bundle. The build-time value is what a host that belongs to nobody gets —
`localhost`, an IP, a preview URL — and it is what each image is built with, so
a container reached by an unbranded name is still itself.

Pars is a readable chain here and **not** a tenant. pars.vote is served from a
fork of this source, which adds its own entry with `add()` — see the boundary
below. The list is open and the choice is made on the first read, which is what
makes a fork's registration land in time.

`brand()` and `home()` are functions rather than the constants they were. The
reason is import order: an ES module graph evaluates every import before any of
the importing file's own statements, so a fork's `add(PARS)` written at the top
of its entry file still runs after this module has finished loading. Reading the
list on first render instead of at load is what makes the registration land, and
`add()` throws if it arrives after the site has been decided rather than
silently serving somebody else's DAO. `chrome/here.ts` defers for the same
reason — the chain it falls back to is the tenant's, so it cannot be fixed
while this module is still being imported.

## The stack boundary: what a fork imports

lux.vote, zoo.vote and hanzo.vote are one build with three names. **pars.vote is
a fork**, because it adds screens rather than a name — a vote-escrow lock on its
own token, a bond market, a network of sub-DAOs — and a tenant flag on a screen
nobody else has is how one app becomes two apps wearing one binary.

A fork depends on this repository and imports from it. There is no build step
and none was added: `package.json` has an `exports` map that publishes `src/`
by subpath as TypeScript, which is what `@hanzogui/element` already does and
what the consumer's bundler already handles.

    "@luxfi/vote": "github:luxfi/vote#<sha>"

    import App, { screen } from '@luxfi/vote'
    import { add } from '@luxfi/vote/chrome/brand'
    import { escrow } from '@luxfi/vote/read/ve'
    import { Panel, Title } from '@luxfi/vote/parts/panel'

Pinned to a commit, because this is a source dependency and a moving branch
would change a fork's screens without a version to point at.

What the boundary is, exactly:

- **`App`** takes `more` — route elements, ranked AHEAD of the base's — and
  `places`, the header entries that reach them. Those two props are the whole of
  what a fork adds to the shell. Ahead rather than after, so a fork can replace
  a screen as well as add one: two routes with the same path rank equally and
  the first is taken, so pars.vote's `/stake` is the stack's escrow screen
  reading Pars's escrow, and there is one screen at that path rather than two.
- **`screen(where, element)`** is exported so a fork's routes get the same error
  boundary and the same fallback as the ones it imported. A fork that wrote its
  own would have routes that fail differently from the rest of the app.
- **`add(brand)`** registers the fork's tenant, before render.
- **`gov/*`, `read/*`, `parts/*`, `routes/*`, `chrome/*`** are all importable.
  A fork's reads are written against `gov/client`'s `presence`/`reader` and
  return `gov/read`'s four-state `Read`, so its screens can use `Reading` and
  say the same four sentences this one does.

The scope is `@luxfi`. `@luxvote` does not exist on npm and inventing a scope
for one package is a second namespace to keep. Nothing here is published: it is
a git dependency, which is also why `private: true` stays.

The lockup is the mark plus **what the mark does not already say**. The Lux mark
is the letters L and X, so the word beside it is "Vote"; the Zoo and Hanzo marks
are glyphs, so theirs read "Zoo Vote" and "Hanzo Vote". Every mark is inline and
in `currentColor` — an `<img>` lands after a round trip and shifts the first row
a person looks at, and a published logo file paints itself from
`prefers-color-scheme`, which is the desktop's answer inside an app that carries
its own.

`index.html` says only "Vote". The tenant is added to `document.title` in
`main.tsx`, because the same file is served on all three hosts and naming one of
them there would put "Lux Vote" in hanzo.vote's tab until the bundle parsed.

## Endpoints: use the path form or a browser sees nothing

Every venue's RPC is `https://api.<org>.network/v1/chain/C/rpc`, never the bare
host. The bare host serves the same chain to `curl` and refuses a browser:
its gateway answers the CORS preflight with **405** and sends no
`access-control-allow-origin`. That arrives as a network error carrying no
chain, so every screen reports the Governor unreadable while the Governor is
fine. The three other chains send `access-control-allow-origin: *` at the root;
Lux does not. The path form works on all four.

The segment in that path is `chain`, and it does not answer yet. It was renamed — `ChainAliasPrefix`
is `"chain"` from `@luxfi/constants` v1.6.4, because `bc` was short for
blockchain and a Lux chain is not always one — and node v1.36.179 removed the
old spelling rather than serving both. The estate was converted to `/v1/chain`
deliberately, ahead of the fleet.

The running nodes are older than that release: `info.getNodeVersion` answers
luxd/1.36.148, thirty-one patches short of the one that renames the segment.
Measured 2026-09-01, `/v1/bc/C/rpc` answers 200 and `/v1/chain/C/rpc` returns
404 on all four of api.lux, api.zoo, api.pars and api.hanzo — each returning
its own chain id, so the fleet is healthy and simply older than the spelling.

These screens therefore stay unreadable until the fleet reaches v1.36.179. That
is a known interim, not a bug to work around by writing `bc` back. It is also
not a redeploy of the gateways: the route tables already match, and what is
short is luxd itself, so closing it is a rolling upgrade of mainnet validators
and is decided on that basis rather than on this repository's.

## What is actually deployed, measured 2026-08-30

Do not trust the written records here — they disagree with the chain and with
each other. `/deployment` measures it on load; these are the numbers it read.

| Chain | State |
| --- | --- |
| **Lux 96369** | Governance stack **live**. Governor `0x976520c3…` 15,050 bytes, Timelock, gLUX votes token, Karma, DLUX, vLUX, VotingLUX, GaugeController all carry code. The DAO Safe on record has **0 bytes**. |
| **Zoo 200200** | Nothing at any of the 4 addresses on record. Chain is at block ~13k — it was re-genesised after those deployments. |
| **Pars 494949** | Nothing at any of the 3 addresses on record. |
| **Hanzo 36963** | Only the Safe carries code (114 bytes). No governance addresses recorded. |

Three record-level contradictions worth knowing:

1. **LP-0020 and LP-3072 assert as a hard invariant that the 96369 Governor is
   0 bytes and that `0x9011` owns nothing there.** It is 15,050 bytes, was
   created by `0x9011`, and `0x9011` owns the votes token and holds
   `CANCELLER_ROLE` on the Timelock.
2. **LP-0020's deployment table lists a live work market on Zoo and Pars with a
   paid bounty.** Both proof transaction hashes return `null` from
   `eth_getTransactionByHash`, and every listed address is empty.
3. **Two files name two different Bounties on Pars** — `deployments/l2-mainnet/
   pars.json` and the DAO repo's `494949.json`, which marks its own block
   superseded.

Governance on 96369 is deployed and correct but **uninhabited**: zero proposals
ever created (full log scan from the Governor's creation block, 1,095,842), and
zero delegated voting power — 100% of the 100M gLUX supply sits with one address
that has never delegated, against a 4M quorum.

## What stands between deployed and live, measured 2026-08-31

The machine is correctly assembled. Read from the chain today:

| | |
| --- | --- |
| Governor | `mode=timestamp`; delay 86,400s, period 604,800s, threshold 100 gLUX, quorum 4% |
| Timelock | Governor holds PROPOSER; EXECUTOR granted to `address(0)`, so anyone executes; `0x9011` keeps CANCELLER; its own ADMIN and PROPOSER were renounced; the timelock administers itself; minDelay 86,400s |
| gLUX | "Lux Governance", 100,000,000 supply, all of it at `0x9011` |
| Delegation | `delegates(0x9011)` is the zero address; `getVotes` is 0; **no DelegateChanged event has ever been emitted** |

The timelock hand-over is done properly and is not the blocker. Three things are:

1. **Nobody can propose.** The threshold is measured in *votes*, not balance, and
   every address has zero votes because nobody has delegated. One transaction —
   `delegate()` on the votes token — turns a balance into voting power. Until it
   happens the Governor cannot be used at all, by anyone.
2. **One address is the whole electorate.** After that delegation `0x9011` alone
   holds 100M against a 4M quorum, so it passes anything unopposed. Distribution
   is the transition; delegation only starts the engine.
3. **The token is still the deployer's.** `owner()` is `0x9011`, the runtime
   carries `mint(address,uint256)` and there is no `cap()`. The owner can mint
   the electorate at will, so the supply figure above is a current reading rather
   than a bound. Transferring ownership to the timelock — or renouncing it — is
   what makes the 100M mean anything.

The treasury is empty: the timelock holds 0 LUX and 0 gLUX. Governance presently
controls no assets, so passing a proposal would move nothing.

## The contracts are not what the prose says

Build ABIs from `luxfi/standard` `out/**` (Foundry artifacts), never from
`contracts/abi/governance.ts` — that barrel is stale and describes an older
Azorius-style set.

- **`Governor.sol`** is OpenZeppelin v5.6.1 with a `quorumFloor` addition. Its
  clock is `mode=timestamp`, so `votingDelay`/`votingPeriod` are **seconds**.
  96369 produces blocks on demand, so reading them as blocks turns 1 day into
  months. `src/read/governance.ts` asks `CLOCK_MODE()` rather than assuming.
- **`Bounty.sol`** is **not** the machine LP-0020 describes. No separate Escrow,
  no arbiter, no dispute state. Its `Status` is
  `None, Open, Claimed, Submitted, Released, Cancelled` and it escrows inside
  `postTask`. Task ids are 1-based.
- **`MultiDAOGovernor`** declares the same seven state names with `Executed` and
  `Expired` **swapped**. Never share one TypeScript enum across the two.
- **`Karma`** is soulbound and not an ERC20 — no `Transfer` event, so there is no
  holder list and no leaderboard is possible.
- **`Roles`** stores no names; a role's name is in the `RoleCreated` log only.
  Wearers are not enumerable.

## `@luxwallet/connect` is login only

Verified by reading its source: it signs a CAIP-122 message and nothing else. No
chain config, no chain switching, no transactions, no reads, and `#provider` is
a hard-private field with no getter. So `src/chrome/wallet.ts` does its own
EIP-6963 discovery and builds viem over the same provider; the connect package
is still what proves the address. Both halves land on the same wallet because
both use EIP-6963 with a `window.ethereum` fallback, in that order.

**Import by subpath, never the root barrel.** `@luxwallet/connect` and
`@luxwallet/connect/connectors` both pull `getConnector`, whose switch names all
seven chains — a bundler follows every branch and stops on the Bitcoin and TON
SDKs, which are optional peers. Use `@luxwallet/connect/nonce` and
`@luxwallet/connect/evm/connect`. The dev server resolves the barrel happily;
only `vite build` finds it.

## Identity is IAM's, and this app builds none of it

**There is no authentication in this repository and there must never be.** No
password, no one-time code, no SIWE, no session of our own, no second gate in
front of IAM's. The credential is typed at the issuer's own origin, PKCE binds
the returned code to this browser, and what arrives back is a token this bundle
only decodes. `src/chrome/id.ts` is a reader of claims; `IamProvider` in
`main.tsx` is the whole of the wiring. Anything that looks like a login flow
being added here is the mistake.

The issuer is a field of the tenant in `BRANDS`, not a second table keyed by the
same three names — identity belongs to the tenant and changes for the tenant's
reason. The client id is `<org>-<app>`, HIP-0111, **derived** from the tenant so a
fork's site gets one from the rule that gave these three theirs:

| Site | Issuer | Client | Registered in |
| --- | --- | --- | --- |
| lux.vote | `https://lux.id` | `lux-vote` | `luxfi/universe` `infra/k8s/iam/provision.yaml` |
| zoo.vote | `https://zoolabs.id` | `zoo-vote` | `zooai/universe` `infra/k8s/iam/provision.yaml` |
| hanzo.vote | `https://hanzo.id` | `hanzo-vote` | `hanzoai/universe` `infra/k8s/iam/provision.yaml` |

Zoo is `zoolabs.id` because `zoo.id` does not resolve and the live IAM stamps
`iss=https://zoolabs.id`. Every issuer is an origin with nothing after it: an
issuer is compared as a literal string, so `https://lux.id/` and `https://lux.id`
are two issuers and only one of them is ever minted. All three are `spa` and
**never confidential** — a browser cannot keep a secret, and IAM demands client
authentication whenever one is stored, which is what killed every login on
lux.cloud until its registration was corrected.

**Nothing here is an environment variable.** The host names the tenant, the
tenant names the issuer, and the issuer plus the derived client id are the whole
configuration. A build flag able to point one tenant's login at another tenant's
issuer could only ever be used to get that wrong.

**The authorize host is pinned back to the tenant.** The SDK reads the authorize
endpoint out of OIDC discovery and a brand IAM may advertise a shared host there
— zoolabs.id's discovery names hanzo.id — so taken at its word a Zoo reader
would be asked to "Sign in to Hanzo" under a Zoo mark. `id.start()` builds the
URL through the SDK (so PKCE and state are minted and stashed; it is not a second
implementation of the flow and could not be) and then pins the host. The code is
still exchanged at the discovered token endpoint, which is already the brand's.

`/auth/callback` is answered by `Returning` in `chrome/account.tsx`, **above the
router**, because a redirect step is not a screen. Adding a route for it would
put a heading on a page nobody reads and would have to exist on every fork.

**An account is not a key.** IAM says which account this is; `chrome/wallet.ts`
holds something that can move value on a chain. Either is true without the other,
and signing in is not a prerequisite for voting — the Governor has never heard of
IAM and counts a signature. `linked` is the only place the two are compared,
because drawing a connected address beside a signed-in name claims the account
owns it and nothing says so.

Claims are read tolerantly and **absent is not empty**: `wallets` is `null` when
the claim is missing (IAM said nothing) and `[]` when it is present and empty
(IAM said none), which the popover says as two different sentences. A row whose
address is not an address is dropped rather than half-drawn, and a `did` that is
not shaped like one is treated as absent — passed on, it would come back from the
registry as a revert that reads on screen as the chain's fault.

**No chain records a DID registry.** `read/id.ts` asks
`luxfi/standard`'s `DIDRegistry`, and `gov/chain.ts` carries the `didRegistry`
slot only for the loopback node: `deployments/local-anvil.json` names one at
`0xB0B3Df1E…`, the four L2 devnet records say `(failed)`, and no mainnet record
names one at all. The same address is `AMMV2Router` in the 96368 testnet record,
which is what proves it is a deployment nonce rather than a registry. So on all
three sites the read answers `unrecorded` without a request and the screen says
no address is recorded — a statement about our files, not about the chain.
`didExists` is asked before `resolve` because `resolve` reverts for anything the
registry does not hold, and a revert would report a healthy registry as
unreadable for everyone without a registration.

## The two high advisories, and why they stay

`pnpm audit` reports two high advisories, both `image-size`, reached only as:

    @hanzo/gui -> @hanzogui/floating -> @floating-ui/react-native
      -> react-native -> @react-native/community-cli-plugin -> metro -> image-size

That is React Native's **native bundler**. Verified: `image-size`, `ICNS`,
`metro-runtime` and `community-cli-plugin` appear in **0** files of `dist/`, and
so does any reference to real `react-native` — the vite alias sends it to
`react-native-web` before anything resolves. **There is no patched version**
(`patched: <0.0.0`).

Removing it was tried and reverted. `auto-install-peers=false` clears the audit
completely and halves the tree, and the build still passes — but `tsc` then
fails, because `@hanzogui/element` publishes `"types": "./src/index.ts"`, raw
TypeScript, and 46 files across the engine import types from `react-native`. So
it is a genuine **type-level** dependency of the design system, not an optional
extra.

Do not suppress the audit and do not hand-write a `react-native` type shim to
make the number go away. The fix belongs upstream: either `@hanzogui/*` ships
`.d.ts` instead of `src`, or `@hanzogui/floating` stops peering on
`@floating-ui/react-native` for web consumers.

## The gates, and the one that was vacuous

`e2e/` carries four suites: `gui` (no utility classes, one `h1`, every control
named), `layout` (five widths, no overflow, 24px targets), `honesty` (no
invented content, absent ≠ empty, all four readings reachable), plus unit tests
in `src/**/*.test.ts`.

**Every route is lazy, so a check must wait for the screen, not for `#root`.**
`ready()` in `e2e/screens.ts` waits for the `h1`. Before it existed the class
check ran against the Suspense fallback and passed on a route that had a
deliberately injected `class="flex items-center bg-red-500"` — thirteen screens
of coverage that measured the shell thirteen times. Found by negative control.
**Re-run that control after touching a gate**: inject a utility class on a raw
element in a route, confirm the suite fails, restore.

The engine swallows `className` on its own components, so a utility class can
only reach the DOM through a raw element or a dependency. Both are what the gate
is for.
