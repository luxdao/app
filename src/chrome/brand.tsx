import type { ReactElement } from 'react'
import { type Venue, venue } from '../gov/chain'

/**
 * Which sites this bundle serves, and what each one is called.
 *
 * lux.vote, zoo.vote and hanzo.vote are ONE build with three names. A fork per
 * DAO is the alternative and it drifts: the app this replaces was forked twice
 * and the copies stopped agreeing about what a proposal was.
 *
 * A TENANT IS NOT A CHAIN. `gov/chain.ts` says which chains are readable —
 * every tenant can read all of them through the picker in the header. This file
 * says which chains have a site, what that site is called and what it is drawn
 * with. The two are separate because they change for different reasons: a chain
 * appears when it is deployed, a site appears when somebody decides to run one.
 *
 * pars.vote is not here. Pars runs its own fork of this source, and a fork adds
 * a tenant by extending `BRANDS` — the list is a value and `tenant()` is a
 * function over it, so the addition is one entry and not a change to how any of
 * this works.
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

export interface Brand {
  /** The venue key, which is also the label the host is recognised by. */
  readonly key: string
  /** What the DAO is called. */
  readonly name: string
  /**
   * The typeset half of the lockup: what the mark does not already say.
   *
   * The Lux mark IS the word — it is the letters L and X — so beside it only
   * "Vote" is left to write. The Zoo and Hanzo marks are glyphs and say nothing,
   * so they carry the name. One rule, three answers, no lockup that reads
   * "Lux Lux Vote".
   */
  readonly word: string
  readonly mark: (props: { height?: number }) => ReactElement
  /** The chain this site opens on. */
  readonly venue: Venue
  /**
   * The IAM that says who a reader is — and the only thing that says it.
   *
   * A field of the tenant rather than a second table keyed by the same three
   * names, because it changes for the tenant's reason and nothing else's: Lux's
   * people sign in at lux.id and Zoo's at zoolabs.id, and a site that sent one
   * to the other's login would be asking for the wrong credential under the
   * wrong mark.
   *
   * The values are the estate's, from `hanzo/cloud/brand` (HIP-0111). Zoo is
   * `zoolabs.id` because `zoo.id` does not resolve and the live IAM stamps
   * `iss=https://zoolabs.id`. No trailing slash: an issuer is compared as a
   * literal string, so `https://lux.id/` and `https://lux.id` are two issuers
   * and only one of them is ever minted.
   */
  readonly issuer: string
}

/**
 * A tenant's chain, by key.
 *
 * Throws rather than falls back. A tenant whose chain is missing from the
 * registry would otherwise open on somebody else's governor and report real
 * figures about the wrong DAO — the one failure a reader cannot detect.
 */
function on(key: string): Venue {
  const v = venue(key)
  if (!v) throw new Error(`No venue "${key}" — a tenant names a chain that is not in the registry.`)
  return v
}

export const BRANDS: readonly Brand[] = [
  { key: 'lux', name: 'Lux', word: 'Vote', mark: Lux, venue: on('lux'), issuer: 'https://lux.id' },
  { key: 'zoo', name: 'Zoo', word: 'Zoo Vote', mark: Zoo, venue: on('zoo'), issuer: 'https://zoolabs.id' },
  { key: 'hanzo', name: 'Hanzo', word: 'Hanzo Vote', mark: Hanzo, venue: on('hanzo'), issuer: 'https://hanzo.id' },
]

/**
 * The tenant a host belongs to.
 *
 * Every label is read rather than the first, because the tenant is not always
 * at the front: `lux.vote`, `www.hanzo.vote` and `vote.zoo.network` all reach
 * the same answer, so a reader following any of them is never shown one chain's
 * figures under another chain's name. No tenant's host carries another tenant's
 * name, so there is nothing here to collide.
 */
export function tenant(host: string, brands: readonly Brand[] = BRANDS): Brand | undefined {
  for (const label of host.split('.')) {
    const b = brands.find((x) => x.key === label)
    if (b) return b
  }
  return undefined
}

/**
 * Which tenant to be when the host names none.
 *
 * A preview URL, a bare address, `localhost`: hosts that belong to nobody. Each
 * image carries its own `VITE_VOTE_HOME`, so lux.vote's container is Lux even
 * when it is reached by a name nothing branded, and a developer on 127.0.0.1
 * gets Lux because that is what the default build says.
 *
 * An unknown key throws rather than falling back to Lux, and `vite.config.ts`
 * refuses the same value at configuration so the cost is a failed build and not
 * a failed site.
 *
 * ## The list is open, and read late
 *
 * pars.vote is a fork of this source, and a site is the whole of what it adds:
 * the reads, the screens and this chrome are imported from here. So a fork
 * calls `add()` once with its own tenant and every screen is its screen from
 * then on.
 *
 * The choice is made on the first read rather than at module load, and that is
 * what makes the order of a fork's imports stop mattering. An ES module graph
 * evaluates every import before any of the importing file's own statements, so
 * a registration written at the top of a fork's entry file still runs after the
 * module it registers with has finished loading — and a tenant added to a list
 * that was already read is a site that silently serves somebody else's DAO.
 * Deferring the read is the same discipline `createGui` follows, for the same
 * reason.
 */
const extra: Brand[] = []

let chosen: Brand | undefined

/**
 * Add a tenant. Before the first render, and it says so if it is not: a late
 * addition would leave the site already drawn under the wrong name.
 */
export function add(...brands: Brand[]): void {
  if (chosen) {
    throw new Error(`Tenant ${brands.map((b) => b.key).join(', ')} was added after the site had already been decided.`)
  }
  extra.push(...brands)
}

/** Every tenant this build serves: the three here, plus whatever a fork added. */
export const brands = (): readonly Brand[] => [...BRANDS, ...extra]

/** Which site this document is. */
export function brand(): Brand {
  if (chosen) return chosen
  const all = brands()
  const wanted = import.meta.env.VITE_VOTE_HOME ?? 'lux'
  const built = all.find((b) => b.key === wanted)
  if (!built) {
    throw new Error(
      `VITE_VOTE_HOME names "${wanted}", which is not a tenant. Known: ${all.map((b) => b.key).join(', ')}.`,
    )
  }
  chosen = tenant(globalThis.location?.hostname ?? '', all) ?? built
  return chosen
}

/** The chain it opens on. */
export const home = (): Venue => brand().venue
