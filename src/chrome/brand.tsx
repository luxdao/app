import type { ReactElement } from 'react'
import type { Venue } from '../gov/chain'

/**
 * Which site this document is, and what a site is.
 *
 * A TENANT IS A SITE: its name, its marks, the chain it reads and the IAM its
 * readers sign in at. This file holds none of them. It says what a tenant
 * carries and picks one; the tenants themselves are declared by whoever builds
 * the site — `src/tenants.tsx` for lux.vote, zoo.vote and hanzo.vote, a fork's
 * own brand file for its site — and handed to `add()` by that build's entry.
 *
 * Every screen, read and piece of chrome imports this file. A tenant table
 * written here would be compiled into every bundle built from this source,
 * whichever site the bundle is; declared by the entry, a bundle carries its own
 * site and nothing of anyone else's.
 */

export interface Brand {
  /** The venue key, which is also the label the host is recognised by. */
  readonly key: string
  /** What the DAO is called. */
  readonly name: string
  /**
   * The typeset half of the lockup, and the whole of what it says.
   *
   * The glyph beside it is a shape and says nothing, so this carries the name
   * and the app both: "Lux Vote". One field rather than a name and a word set
   * side by side, because two fields is how a lockup ends up reading "Zoo Zoo
   * Vote" the day a tenant's name is already in its word.
   *
   * The header collapses it to its last word as the page scrolls, so this reads
   * from the general to the particular: the estate, then the app.
   */
  readonly word: string
  readonly mark: (props: { height?: number }) => ReactElement
  /**
   * The same identity where there is room for a mark and not a word.
   *
   * Lux's `mark` is its name set in letterforms, so it needs a second drawing
   * for a corner; Zoo's and Hanzo's are already glyphs and answer both
   * questions with one file. The header reads the page's position and shows
   * whichever fits.
   */
  readonly glyph: (props: { height?: number }) => ReactElement
  /**
   * The mark in the browser's own chrome — a tab, a bookmark, a home screen.
   *
   * A field of the tenant and not a file in this repository, because a tab is
   * the one surface where an estate's mark is not ours to choose: zoo.vote is
   * Zoo's, and Lux's triangle in its tab would be Lux's brand on Zoo's site.
   * Each estate serves its own from its own place. `head` in main.tsx puts it
   * on the document, beside the title, for the same reason the title is set
   * there — one file, three hosts.
   */
  readonly icon: { readonly svg: string; readonly touch: string }
  /** The chain this site opens on, declared with the site and nowhere else. */
  readonly venue: Venue
  /**
   * The same tenant's chain on the machine running `pnpm dev`, and only there.
   * A tenant declares it under `import.meta.env.DEV`, which is a literal at
   * build time, so a production bundle carries none.
   */
  readonly local?: Venue
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
 * The tenant a host belongs to.
 *
 * Every label is read rather than the first, because the tenant is not always
 * at the front: `lux.vote`, `www.hanzo.vote` and `vote.zoo.network` all reach
 * the same answer, so a reader following any of them is never shown one chain's
 * figures under another chain's name. No tenant's host carries another tenant's
 * name, so there is nothing here to collide.
 */
export function tenant(host: string, list: readonly Brand[] = brands()): Brand | undefined {
  for (const label of host.split('.')) {
    const b = list.find((x) => x.key === label)
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
 * ## The list is filled by the entry, and read late
 *
 * Every site registers its own tenants from its own entry file: this
 * repository's `main.tsx` adds lux, zoo and hanzo from `src/tenants.tsx`, and
 * pars.vote, a fork of this source, adds Pars from its own. The reads, the
 * screens and this chrome are imported by both and name nobody, so a bundle
 * carries the tenants its entry added and no others.
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
const added: Brand[] = []

let chosen: Brand | undefined

/**
 * Add a tenant. Before the first render, and it says so if it is not: a late
 * addition would leave the site already drawn under the wrong name.
 */
export function add(...brands: Brand[]): void {
  if (chosen) {
    throw new Error(`Tenant ${brands.map((b) => b.key).join(', ')} was added after the site had already been decided.`)
  }
  added.push(...brands)
}

/** Every tenant this build serves: whatever its entry added. */
export const brands = (): readonly Brand[] => [...added]

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
