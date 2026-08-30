# vote

The governance interface for lux.vote, built on `@hanzo/gui`.

Every figure on every screen is read from the chain when the screen opens.
Nothing is seeded, cached or illustrative, and the interface holds no key —
you sign every transaction in your own wallet.

## Running it

```
pnpm install
pnpm dev        # http://127.0.0.1:5288
pnpm verify     # typecheck, unit tests, build, then the browser suite against the build
```

`pnpm verify` is the gate. It runs the browser suite against the **built**
output rather than the dev server, because a suite that never bundles says
nothing about whether the thing ships — a missing export in an optional peer
took this build down while the dev server stayed green.

## Screens

| Route | What it reads |
| --- | --- |
| `/` | Governor parameters, the proposal count, and whether anyone can vote |
| `/proposals` | Every `ProposalCreated` log, with each proposal's live state and tally |
| `/proposals/:id` | One proposal, its window and its votes; casts a vote |
| `/proposals/new` | Opens a proposal, after saying what it takes to open one |
| `/delegate` | Balance against voting power, delegation, and the vote-escrow lock |
| `/treasury` | Timelock delay and roles, and what the treasury contracts hold |
| `/work` | The bounty board and the contribution ledger |
| `/roles` | The role registry — ids, parents, wearer counts |
| `/karma` | Soulbound reputation: supply, cap, and your own standing |
| `/gauges` | Fee direction, weighted by vote-escrow |
| `/deployment` | Every address on record, on all four chains, asked of its own chain |
| `/settings` | Governance parameters, the endpoint, theme and type |

## The rule

Four readings, never two:

- **deployed** — code was found at the address
- **not deployed** — the chain answered and there is no code there
- **not read** — the call was refused or timed out; nothing is known either way
- **no record** — no file names an address for this contract on this chain

A contract with no code answers a call with empty data rather than an error, so
an interface that does not ask the question cannot tell an absent contract from
an idle one. `/deployment` asks it for every address, on every chain, on load.

`e2e/honesty.spec.ts` enforces this against the rendered page.

## Licence

Lux Ecosystem Licence. See `LICENSE`.
