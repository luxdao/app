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
 * The segment is `chain`, which is the estate's declared form: `luxfi/universe`
 * records `rpcPath: /v1/chain/C/rpc`, the exchange asks it, and the gateway in
 * front of the nodes answers it. `luxd` registers one route prefix from
 * constants.ChainAliasPrefix — older builds spell it `bc`, newer ones `chain`.
 * The mainnet validators now run node v1.36.181 and serve `chain` themselves;
 * `/v1/bc/C/rpc` is a 404 on every one of them, so no translation is left
 * anywhere in the path. The paths here are the estate's, not a node's — a build
 * pinned to a node's own spelling breaks the day the node is recycled, which is
 * what just happened to `bc`.
 *
 * Every endpoint is the path form and not the bare host. Both answer a browser
 * today: `https://api.lux.network/` serves this chain and returns 204 with
 * `access-control-allow-origin: *` on the preflight, as the path form does. The
 * difference is what they name. The path names the chain it reads; the root
 * means whatever the gateway last mapped it to, so re-pointing the root moves
 * every screen here onto another chain without changing a line of this file.
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
    rpc: 'https://api.lux.network/v1/chain/c/rpc',
    explorer: 'https://explore.lux.network',
    // From deployments/gov-vote/96369.json, and every one of these eight now
    // answers with code — the set in the retired app's `luxDevnet` block
    // belongs to 96370 and is empty here, which is how a devnet address came to
    // be advertised as mainnet governance.
    //
    // They are a contiguous CREATE run by 0x9011E888…4714 at nonces 764–772, in
    // the order `script/deploy_gov_vote.sh` deploys them. That is why the
    // re-genesised chain carries the same addresses the records already named:
    // CREATE depends only on deployer and nonce, so the run was replayed onto
    // the fresh chain rather than the records rewritten to follow it. Deploying
    // these in any other order moves all eight.
    at: {
      governor: '0x976520c30903F0744814D149574f9C0D9BaA1431',
      timelock: '0x62617aB01F263ce2b8432065b6d1d8D031665c74',
      votes: '0x10192320Aea3444cf8e85EB617Ab47479Ea0e640',
      karma: '0x957d52850786db4D65e14DEf4F2B16A8A071c2cE',
      dlux: '0xc812C2A8E8032bf8d97E3E377F40A59Aa9cA298F',
      vlux: '0x9aAB909D3e673CCBCfEacF96F96585B8e75bf1D9',
      votingLux: '0x160cD157d1f3A178d74962c28D71AdADb7AEDFcd',
      gauges: '0x7F17E6430A6ea24AF5472e89Fc86e93C4F57073b',
      // Zero bytes, and recorded so the screens can say so. This address did
      // answer as Safe 1.5.0 — threshold 1, sole owner
      // 0x9011e888251ab053b7bd1cdb598db4f9ded94714 — before 96369 was
      // re-genesised. The chain now begins at a genesis that funds that owner
      // and deploys nothing, so no Safe exists at any address on it, and
      // `luxfi/standard` deployments/safe/96369.json says the same in its own
      // words: status `pending-deploy`. Dropping the address would not make the
      // screens truer, it would make them say no address is on record — which
      // is a different fact, and not this one.
      safe: '0x4CB86Cbb76Ed31E68825F9e24480EEdF5B9b1951',
    },
  },
  {
    id: 200200,
    key: 'zoo',
    ...zoo,
    rpc: 'https://api.zoo.network/v1/chain/c/rpc',
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
    rpc: 'https://api.pars.network/v1/chain/c/rpc',
    explorer: 'https://explore.pars.network',
    // Two records name two different Bounties here. This is the one in
    // deployments/l2-mainnet/pars.json; the DAO repo names another, and that
    // file marks its own work-market block superseded.
    at: {
      bounty: '0x79254D4A9286FBd65E7177440Be20f00934c33c2',
      governor: '0x62Ea1B27CDD922dbAaE0572f4CD4862Ca939C24c',
      safe: '0x4CEA4ac1C874a340B06e0422E77a477463C3a542',
    },
  },
  {
    id: 36963,
    key: 'hanzo',
    ...hanzo,
    rpc: 'https://api.hanzo.network/v1/chain/c/rpc',
    explorer: 'https://explore.hanzo.network',
    // deployments/l2-mainnet/hanzo.json carries no contract addresses at all —
    // its contracts block is a note saying none are consensus-confirmed. Only
    // the Safe infrastructure was recorded.
    at: { safe: '0xB68C73BAd0C967Ba6c9b6C0ae0D4A38138F474cb' },
  },
  // One node per tenant on the machine running this, and only there.
  // `import.meta.env.DEV` is replaced with a literal at build time, so these
  // entries are removed from a production bundle rather than hidden by it: a
  // chain nobody else can reach must not appear on a deployed site.
  ...(import.meta.env.DEV
    ? [
        loop('lux', 96372, 9860, lux, '0x90c538BB0448d14948c2b48a0F0C16efc3F0FA9a'),
        loop('zoo', 200203, 9870, zoo, '0x90c538BB0448d14948c2b48a0F0C16efc3F0FA9a'),
        loop('hanzo', 36966, 9880, hanzo, '0xD235571A8ED990638699d87c1e7527F576C91aB7'),
      ]
    : []),
] as const

/**
 * A tenant's chain on this machine: `luxfi/standard` `script/localnet.sh up` runs
 * the node, `script/deploy_gov_vote.sh` deploys governance into it, and
 * `DeployWorkMarket` the work market after it. Every address is the deployer's
 * nonce on a fresh chain. Governance sends the same transactions in the same
 * order on every chain, so its addresses are shared; the work market lands after
 * however many blocks the deploy had to wait for, so its bounty is per chain.
 */
function loop(
  key: string,
  id: number,
  port: number,
  brand: { name: string; symbol: string },
  bounty: `0x${string}`,
): Venue {
  return {
    id,
    key: `local-${key}`,
    name: `${brand.name} local`,
    symbol: brand.symbol,
    rpc: `http://127.0.0.1:${port}/v1/chain/C/rpc`,
    explorer: null,
    at: {
      governor: '0x0165878A594ca255338adfa4d48449f69242Eb8F',
      timelock: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
      votes: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
      vlux: '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9',
      dlux: '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9',
      votingLux: '0x5FC8d32690cc91D4c39d9d3abcBD16989F875707',
      karma: '0xa513E6E4b8f2a923D98304ec87F64353C4D5C853',
      gauges: '0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6',
      bounty,
    },
  }
}

export const venue = (key: string): Venue | undefined => VENUES.find((v) => v.key === key)

/**
 * Which chain a screen opens on is NOT settled here.
 *
 * It follows from which tenant this document is — lux.vote opens on Lux — and
 * that is `src/chrome/brand.tsx`'s question: the host names a tenant, the
 * tenant names a chain, and `HOME` is exported from there. This file says only
 * which chains are readable and where, because every venue in it is reachable
 * from every tenant through the picker in the header.
 */
