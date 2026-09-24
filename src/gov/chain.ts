import { getChain } from '@luxwallet/chains'

/**
 * What a chain this interface reads is, and the addresses recorded on it.
 *
 * NOT A REGISTRY. Each site declares its own chain beside its own name and
 * mark — the stack's three in `src/tenants.tsx`, a fork's in its own brand
 * file — so a bundle carries the chain it reads and no other. A register of
 * every estate's chain compiled into every site is how pars.vote came to ship
 * Lux's governor addresses and RPC to every reader, under Pars's name.
 *
 * An address is a CANDIDATE, never a claim. Every deployment record on disk
 * disagreed with at least one other when this was written — the LPs, the
 * per-chain manifests and the DAO repo each name a different Bounty on Pars,
 * and the LPs assert a Governor of zero bytes at an address that answers with
 * fifteen thousand. So nothing declared anywhere asserts that a contract
 * exists. `presence()` asks the chain and the screens render what it answers.
 *
 * The segment is `chain`, which is the estate's declared form: `luxfi/universe`
 * records `rpcPath: /v1/chain/C/rpc`, the exchange asks it, and the gateway in
 * front of the nodes answers it. `luxd` registers one route prefix from
 * constants.ChainAliasPrefix — older builds spell it `bc`, newer ones `chain`.
 * The mainnet validators now run node v1.36.181 and serve `chain` themselves;
 * `/v1/bc/C/rpc` is a 404 on every one of them, so no translation is left
 * anywhere in the path. A declared path is the estate's, not a node's — a build
 * pinned to a node's own spelling breaks the day the node is recycled, which is
 * what just happened to `bc`.
 *
 * Every endpoint is the path form and not the bare host. Both answer a browser
 * today: `https://api.lux.network/` serves this chain and returns 204 with
 * `access-control-allow-origin: *` on the preflight, as the path form does. The
 * difference is what they name. The path names the chain it reads; the root
 * means whatever the gateway last mapped it to, so re-pointing the root moves
 * every screen here onto another chain without changing a line of the
 * declaration.
 */

export type Slot =
  | 'governor'
  | 'timelock'
  | 'votes'
  | 'karma'
  | 'dlux'
  | 've'
  | 'votingLux'
  | 'gauges'
  | 'bounty'
  | 'roles'
  | 'safe'
  | 'didRegistry'

export interface Venue {
  /** EIP-155 chain id, and the key every screen selects on. */
  readonly id: number
  readonly key: string
  readonly name: string
  readonly symbol: string
  readonly rpc: string
  readonly explorer: string | null
  readonly at: Readonly<Partial<Record<Slot, `0x${string}`>>>
}

/**
 * Chain identity, taken from the wallet registry rather than restated beside
 * each chain, so a site's declaration does not become a second roster that
 * drifts from the first.
 */
export function identity(id: number, fallback: { name: string; symbol: string }) {
  const row = getChain(id)
  return { name: row?.name ?? fallback.name, symbol: row?.nativeAsset?.symbol ?? fallback.symbol }
}
