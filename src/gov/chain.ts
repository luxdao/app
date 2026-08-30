import { getChain } from '@luxwallet/chains'

/**
 * The chains this interface reads, and the addresses recorded for each.
 *
 * An address here is a CANDIDATE, never a claim. Every deployment record on
 * disk disagreed with at least one other when this was written — the LPs, the
 * per-chain manifests and the DAO repo each name a different Bounty on Pars,
 * and the LPs assert a Governor of zero bytes at an address that answers with
 * fifteen thousand. So nothing in this file asserts that a contract exists.
 * `presence()` asks the chain and the screens render what it answers.
 *
 * Identity — name, symbol, EIP-155 id — comes from `@luxwallet/chains` so this
 * file does not become a second roster that drifts from the first.
 *
 * Every endpoint is the `/v1/bc/C/rpc` form and not the bare host, because only
 * the path form answers a browser. `https://api.lux.network` serves the same
 * chain and the same results to curl, but it sits behind a gateway that refuses
 * the CORS preflight with 405 and sends no `access-control-allow-origin`, so a
 * browser never sees the response. That failure arrives as a network error with
 * no chain in it — every screen would report the Governor unreadable while the
 * Governor was fine — which is why the path is recorded here rather than left
 * to whoever writes the next endpoint.
 */

export type Slot =
  | 'governor'
  | 'timelock'
  | 'votes'
  | 'karma'
  | 'dlux'
  | 'vlux'
  | 'votingLux'
  | 'gauges'
  | 'bounty'
  | 'roles'
  | 'safe'

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

/** Chain identity, taken from the wallet registry rather than restated here. */
function identity(id: number, fallback: { name: string; symbol: string }) {
  const row = getChain(id)
  return { name: row?.name ?? fallback.name, symbol: row?.nativeAsset?.symbol ?? fallback.symbol }
}

const lux = identity(96369, { name: 'Lux', symbol: 'LUX' })
const zoo = identity(200200, { name: 'Zoo', symbol: 'ZOO' })
const pars = identity(494949, { name: 'Pars', symbol: 'PARS' })
const hanzo = identity(36963, { name: 'Hanzo', symbol: 'AI' })

export const VENUES: readonly Venue[] = [
  {
    id: 96369,
    key: 'lux',
    ...lux,
    rpc: 'https://api.lux.network/v1/bc/C/rpc',
    explorer: 'https://explore.lux.network',
    // From deployments/gov-vote/96369.json. This is the set the chain answers
    // for; the set in the retired app's `luxDevnet` block belongs to 96370 and
    // is empty here, which is how a devnet address came to be advertised as
    // mainnet governance.
    at: {
      governor: '0x976520c30903F0744814D149574f9C0D9BaA1431',
      timelock: '0x62617aB01F263ce2b8432065b6d1d8D031665c74',
      votes: '0x10192320Aea3444cf8e85EB617Ab47479Ea0e640',
      karma: '0x957d52850786db4D65e14DEf4F2B16A8A071c2cE',
      dlux: '0xc812C2A8E8032bf8d97E3E377F40A59Aa9cA298F',
      vlux: '0x9aAB909D3e673CCBCfEacF96F96585B8e75bf1D9',
      votingLux: '0x160cD157d1f3A178d74962c28D71AdADb7AEDFcd',
      gauges: '0x7F17E6430A6ea24AF5472e89Fc86e93C4F57073b',
      safe: '0xDA215aab35CD29097B0d454042f676F1dA02497F',
    },
  },
  {
    id: 200200,
    key: 'zoo',
    ...zoo,
    rpc: 'https://api.zoo.network/v1/bc/C/rpc',
    explorer: 'https://explore.zoo.network',
    // deployments/l2-mainnet/zoo.json records a consensus split: the work
    // market and governance modules reached only one pod of five and are marked
    // "do NOT use". They are carried so the deployment screen can show what was
    // recorded against what the chain answers, which is the whole disagreement.
    at: {
      bounty: '0x857c9fE5A644e048FEF7194Da10fFEb356a81fFD',
      karma: '0xA8898F8573a463C167584979dc7E2cD43c24BAdF',
      governor: '0xc23e396acA1CbB0D0cF1debc8371eDddbf52430e',
      safe: '0x229599f227231d8C90fcF1a78589F5DC4b7A6962',
    },
  },
  {
    id: 494949,
    key: 'pars',
    ...pars,
    rpc: 'https://api.pars.network/v1/bc/C/rpc',
    explorer: 'https://explore.pars.network',
    // Two records name two different Bounties here. This is the one in
    // deployments/l2-mainnet/pars.json; the DAO repo names another, and that
    // file marks its own work-market block superseded.
    at: {
      bounty: '0x316B41c886c7D4B4e38cBB08a243776Ed977cf1F',
      governor: '0x62Ea1B27CDD922dbAaE0572f4CD4862Ca939C24c',
      safe: '0x4CEA4ac1C874a340B06e0422E77a477463C3a542',
    },
  },
  {
    id: 36963,
    key: 'hanzo',
    ...hanzo,
    rpc: 'https://api.hanzo.network/v1/bc/C/rpc',
    explorer: 'https://explore.hanzo.network',
    // deployments/l2-mainnet/hanzo.json carries no contract addresses at all —
    // its contracts block is a note saying none are consensus-confirmed. Only
    // the Safe infrastructure was recorded.
    at: { safe: '0xB68C73BAd0C967Ba6c9b6C0ae0D4A38138F474cb' },
  },
] as const

export const venue = (key: string): Venue | undefined => VENUES.find((v) => v.key === key)

/**
 * The chain this build opens on.
 *
 * One app, every brand. lux.vote and zoo.vote are the same bundle built twice
 * with a different home, the way the rest of the estate white-labels — rather
 * than a fork per DAO that drifts.
 *
 * An unknown key throws at build rather than falling back to Lux. A build that
 * quietly opened on the wrong chain would ship a Zoo site reading Lux's
 * governor, and every figure on it would be real and about the wrong DAO —
 * which is the one failure a reader could not detect.
 */
const wanted = import.meta.env.VITE_VOTE_HOME ?? 'lux'
const home = venue(wanted)
if (!home) {
  throw new Error(
    `VITE_VOTE_HOME names "${wanted}", which is not a venue. Known: ${VENUES.map((v) => v.key).join(', ')}.`,
  )
}
export const HOME: Venue = home
