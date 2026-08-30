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

## Endpoints: use the path form or a browser sees nothing

Every venue's RPC is `https://api.<org>.network/v1/bc/C/rpc`, never the bare
host. The bare host serves the same chain to `curl` and refuses a browser:
its gateway answers the CORS preflight with **405** and sends no
`access-control-allow-origin`. That arrives as a network error carrying no
chain, so every screen reports the Governor unreadable while the Governor is
fine. The three other chains send `access-control-allow-origin: *` at the root;
Lux does not. The path form works on all four.

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
