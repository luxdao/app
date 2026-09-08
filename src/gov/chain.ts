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
 * front of the nodes is what answers it. `luxd` itself registers one route
 * prefix from constants.ChainAliasPrefix — older builds spell it `bc`, newer
 * ones `chain` — and the mainnet node measured today answers `bc` and 404s
 * `chain`, so the gateway carries the translation until the nodes move. The
 * paths here are the estate's, not a node's; a build pinned to a node's own
 * spelling breaks the day the node is recycled.
 *
 * Every endpoint is the path form and not the bare host, because only
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
    rpc: 'https://api.lux.network/v1/chain/C/rpc',
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
      // 0xDA215aab35CD29097B0d454042f676F1dA02497F stood here and is zero bytes
      // on 96369. This one answers: Safe 1.5.0, threshold 1, sole owner
      // 0x9011e888251ab053b7bd1cdb598db4f9ded94714 — the same owner Hanzo's
      // Safe carries. Checked with eth_getCode and getOwners, which is the only
      // thing that settles an address here; a plausible-looking one that holds
      // no code reads on the Treasury screen as a real holding of zero.
      safe: '0x4CB86Cbb76Ed31E68825F9e24480EEdF5B9b1951',
    },
  },
  {
    id: 200200,
    key: 'zoo',
    ...zoo,
    rpc: 'https://api.zoo.network/v1/chain/C/rpc',
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
    rpc: 'https://api.pars.network/v1/chain/C/rpc',
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
    rpc: 'https://api.hanzo.network/v1/chain/C/rpc',
    explorer: 'https://explore.hanzo.network',
    // deployments/l2-mainnet/hanzo.json carries no contract addresses at all —
    // its contracts block is a note saying none are consensus-confirmed. Only
    // the Safe infrastructure was recorded.
    at: { safe: '0xB68C73BAd0C967Ba6c9b6C0ae0D4A38138F474cb' },
  },
  // A node on the machine running this, and only there. `import.meta.env.DEV` is
  // replaced with a literal at build time, so this whole entry is removed from a
  // production bundle rather than hidden by it: a chain nobody else can reach
  // must not appear in the picker on a deployed site.
  //
  // The addresses are wherever `DeployGovernance` last put them on a fresh
  // chain — they are deterministic for a given nonce order, not a registry, so
  // re-deploying in a different order moves them and this needs re-reading.
  ...(import.meta.env.DEV
    ? [
        {
          id: 96368,
          key: 'local' as const,
          name: 'Lux local',
          symbol: 'LUX',
          rpc: 'http://127.0.0.1:9750/v1/chain/C/rpc',
          explorer: null,
          at: {
            governor: '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9',
            timelock: '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9',
            votes: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
            // The DID registry, and the only place any record names one.
            // `luxfi/standard` `deployments/local-anvil.json` puts it here on a
            // chain that answers as 96369 at this loopback address, and no
            // mainnet record names one at all — the four L2 devnet files record
            // it as "(failed)" and osage records the gas limit that stopped it.
            // The same address is AMMV2Router in the 96368 testnet record, which
            // is the proof that it is a nonce, not a registry: the four mainnet
            // venues above therefore carry no slot and the interface says no
            // address is recorded rather than reading somebody else's contract.
            didRegistry: '0xB0B3Df1E279D87e72738487Df8d7c0d7c2D1eFcE',
          },
        } satisfies Venue,
      ]
    : []),
] as const

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
