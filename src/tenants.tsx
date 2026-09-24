import type { ReactElement } from 'react'
import type { Brand } from './chrome/brand'
import { identity, type Venue } from './gov/chain'

/**
 * lux.vote, zoo.vote and hanzo.vote: the sites this repository builds, and what
 * each is called, drawn with, reads and signs in at.
 *
 * ONE SOURCE, THREE NAMES. The three sites are this bundle with a different
 * `VITE_VOTE_HOME`. A fork per DAO is the alternative and it drifts: the app
 * this replaces was forked twice and the copies stopped agreeing about what a
 * proposal was.
 *
 * Only `src/main.tsx` imports this file, and it hands the list to `add()`. The
 * screens, the reads and the chrome never do — that is what keeps these three
 * out of a fork. pars.vote is a fork of this source that registers its own
 * tenant from its own entry, and a bundle built from it carries none of the
 * names, marks, issuers, RPCs or addresses below. A table that every screen
 * imported would compile all three into every bundle built from this source,
 * whoever's site that bundle is.
 *
 * ## Why every mark is drawn here rather than fetched
 *
 * An `<img>` renders after a round trip and moves the row it sits in when it
 * lands, which is a layout shift on the first thing a person looks at.
 *
 * And every mark takes `currentColor` rather than its brand's own colours. A
 * published logo file paints itself with a `prefers-color-scheme` rule, so it
 * follows the desktop — the wrong authority inside an app that carries its own
 * setting. Somebody reading this in light on a dark machine would get a white
 * mark on a white header. Inheriting the colour puts the mark under the same
 * token layer as the text beside it, which is what `@hanzo/appearance` moves.
 */

/** How tall a mark stands in the header. */
const HEIGHT = 20


/**
 * The Lux triangle: the estate's mark where there is room for a mark and not a
 * word. The same drawing the browser tab wears, so the thing in the corner of a
 * screen and the thing in the corner of a tab are one shape.
 *
 * Its own 100×100 box, and the path sits high in it — the published file
 * carries a translate that centres the optical mass rather than the bounding
 * box, and a triangle's centre of area is not its centre of ink.
 */
function Wedge({ height = HEIGHT }: { height?: number }): ReactElement {
  return (
    <svg viewBox="0 0 100 100" height={height} width={height} fill="currentColor" role="img" aria-label="Lux">
      <path d="M50 85 L15 25 L85 25 Z" transform="translate(0 -5)" />
    </svg>
  )
}

/**
 * The Lux wordmark: the letterforms L, U and X, at the published 63×17 viewBox.
 *
 * The whole word, not the two-letter lockup. `LX` is lux.exchange's mark and
 * lux.exchange's alone — a product's shorthand rather than the network's name —
 * so a governance interface for the network wears the name the network is
 * called. Same file, the U restored, taken verbatim from `@luxfi/logo`'s
 * published `lux-wordmark-white.svg` and painted in `currentColor` so it moves
 * with the theme rather than with the desktop.
 *
 * Twenty rather than the type size beside it. The letterforms are all caps and
 * the viewBox is their cap height exactly, so a mark set to the size of the
 * word beside it comes out visibly smaller — cap height is around seven tenths
 * of a face's size, and matching the numbers is what makes a lockup look shrunk.
 */
function Lux({ height = HEIGHT }: { height?: number }): ReactElement {
  return (
    <svg
      viewBox="0 0 63 17"
      height={height}
      width={(height * 63) / 17}
      fill="currentColor"
      fillRule="nonzero"
      role="img"
      aria-label="Lux"
    >
      <polygon points="18 12.485 18 17 0 17 0 0 5.061 0 5.061 12.485" />
      <path d="M62.991,0 L56.069,0 L50.841,5.265 L45.64,0 L33.537,0 L33.537,8.355 C33.537,10.39 32.904,12.547 28.355,12.547 C23.805,12.547 23.173,10.418 23.173,8.355 L23.173,0 L18,0 L18,8.355 C18,14.199 21.107,17 28.364,17 C35.593,17 38.728,14.171 38.728,8.355 L38.728,0.327 C38.728,0.215 38.858,0.159 38.942,0.233 L47.25,8.374 L38.7,16.748 L45.649,16.748 L50.85,11.483 L56.078,16.748 L63,16.748 L54.478,8.374 L62.991,0 Z" />
    </svg>
  )
}

/**
 * The Zoo mark: three circles overlapping inside a fourth, in outline.
 *
 * Centres and radii from zoo/logo `LOGO_SETTINGS`, which every Zoo site draws
 * from; this is its monochrome cut, which is stroked rather than filled. The
 * viewBox is cropped to the containing circle plus half its stroke — the
 * published file sits in a 1024 box with the mark small in the middle, and a
 * lockup cannot use the whitespace of somebody else's export.
 */
function Zoo({ height = HEIGHT }: { height?: number }): ReactElement {
  return (
    <svg
      viewBox="225 227 566 566"
      height={height}
      width={height}
      fill="none"
      stroke="currentColor"
      strokeWidth={33}
      role="img"
      aria-label="Zoo"
    >
      <clipPath id="zoo-mark">
        <circle cx="508" cy="510" r="283" />
      </clipPath>
      <g clipPath="url(#zoo-mark)">
        <circle cx="513" cy="369" r="234" />
        <circle cx="365" cy="595" r="234" />
        <circle cx="643" cy="595" r="234" />
        <circle cx="508" cy="510" r="265" strokeWidth={36} />
      </g>
    </svg>
  )
}

/**
 * The Hanzo mark: the block H, at the published 67×67 viewBox.
 *
 * Five filled rectangles and the bar between them, from
 * `@hanzo/gui` shell `mark.tsx` — the same geometry the rest of the estate's
 * chrome draws, so the header here and the header on hanzo.ai are one mark.
 */
function Hanzo({ height = HEIGHT }: { height?: number }): ReactElement {
  return (
    <svg viewBox="0 0 67 67" height={height} width={height} fill="currentColor" role="img" aria-label="Hanzo">
      <path d="M22.21 67V44.6369H0V67H22.21Z" />
      <path d="M66.7038 22.3184H22.2534L0.0878906 44.6367H44.4634L66.7038 22.3184Z" />
      <path d="M22.21 0H0V22.3184H22.21V0Z" />
      <path d="M66.7198 0H44.5098V22.3184H66.7198V0Z" />
      <path d="M66.7198 67V44.6369H44.5098V67H66.7198Z" />
    </svg>
  )
}

const lux = identity(96369, { name: 'Lux', symbol: 'LUX' })
const zoo = identity(200200, { name: 'Zoo', symbol: 'ZOO' })
const hanzo = identity(36963, { name: 'Hanzo', symbol: 'AI' })

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
      ve: '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9',
      dlux: '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9',
      votingLux: '0x5FC8d32690cc91D4c39d9d3abcBD16989F875707',
      karma: '0xa513E6E4b8f2a923D98304ec87F64353C4D5C853',
      gauges: '0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6',
      bounty,
    },
  }
}

const LUX_CHAIN: Venue = {
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
    ve: '0x9aAB909D3e673CCBCfEacF96F96585B8e75bf1D9',
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
}

const ZOO_CHAIN: Venue = {
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
}

const HANZO_CHAIN: Venue = {
  id: 36963,
  key: 'hanzo',
  ...hanzo,
  rpc: 'https://api.hanzo.network/v1/chain/c/rpc',
  explorer: 'https://explore.hanzo.network',
  // deployments/l2-mainnet/hanzo.json carries no contract addresses at all —
  // its contracts block is a note saying none are consensus-confirmed. Only
  // the Safe infrastructure was recorded.
  at: { safe: '0xB68C73BAd0C967Ba6c9b6C0ae0D4A38138F474cb' },
}

/**
 * The three tenants.
 *
 * `local` is the tenant's chain on the machine running `pnpm dev`, and only
 * there: `import.meta.env.DEV` is replaced with a literal at build time, so it
 * is removed from a production bundle rather than hidden by it. A chain nobody
 * else can reach must not appear on a deployed site.
 */
export const TENANTS: readonly Brand[] = [
  {
    key: 'lux',
    name: 'Lux',
    word: 'Lux Vote',
    mark: Lux,
    glyph: Wedge,
    venue: LUX_CHAIN,
    local: import.meta.env.DEV ? loop('lux', 96372, 9860, lux, '0x90c538BB0448d14948c2b48a0F0C16efc3F0FA9a') : undefined,
    icon: { svg: 'https://cdn.lux.cloud/brand/favicon.svg', touch: 'https://cdn.lux.cloud/brand/icon-180.png' },
    issuer: 'https://lux.id',
  },
  {
    key: 'zoo',
    name: 'Zoo',
    word: 'Zoo Vote',
    mark: Zoo,
    glyph: Zoo,
    venue: ZOO_CHAIN,
    local: import.meta.env.DEV ? loop('zoo', 200203, 9870, zoo, '0x90c538BB0448d14948c2b48a0F0C16efc3F0FA9a') : undefined,
    icon: { svg: 'https://zoo.ngo/favicon.svg', touch: 'https://zoo.ngo/icon-180.png' },
    issuer: 'https://zoolabs.id',
  },
  {
    key: 'hanzo',
    name: 'Hanzo',
    word: 'Hanzo Vote',
    mark: Hanzo,
    glyph: Hanzo,
    venue: HANZO_CHAIN,
    local: import.meta.env.DEV ? loop('hanzo', 36966, 9880, hanzo, '0x90c538BB0448d14948c2b48a0F0C16efc3F0FA9a') : undefined,
    icon: { svg: 'https://hanzo.ai/favicon.svg', touch: 'https://hanzo.ai/icon-180.png' },
    issuer: 'https://hanzo.id',
  },
]
