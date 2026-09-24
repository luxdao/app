import { useSyncExternalStore } from 'react'
import { VENUES, type Venue } from '../gov/chain'
// The chain to open on is the TENANT's, not the registry's: lux.vote opens on
// Lux and hanzo.vote on Hanzo, from one build.
import { home } from './brand'

/**
 * Which chain the interface is reading.
 *
 * Module-level rather than context, so a read module can ask without being
 * rendered — and so the whole tree can be keyed on it, which is what makes a
 * chain change discard every in-flight read rather than let one land against
 * the wrong chain's screen.
 */
const KEY = 'vote.chain'

/**
 * The chain a reader last picked — if it is one this site reads. A stored key
 * is only ever read against the roster: `vote.chain=lux` left in pars.vote's
 * storage must open Pars, not put Lux's chain under Pars's name.
 */
function stored(): Venue {
  try {
    const k = localStorage.getItem(KEY)
    return (k && roster().find((v) => v.key === k)) || home()
  } catch {
    return home()
  }
}

/**
 * Read on first ask rather than at module load, because the tenant it falls
 * back to is decided on first ask too — a fork registers its own before
 * anything renders, and a chain fixed while this module was being imported
 * would be fixed before the registration had run.
 */
let current: Venue | null = null
const listeners = new Set<() => void>()

export function go(v: Venue): void {
  current = v
  try {
    localStorage.setItem(KEY, v.key)
  } catch {
    // A browser refusing storage still gets to change chain for this session.
  }
  for (const l of listeners) l()
}

const watch = (l: () => void) => {
  listeners.add(l)
  return () => void listeners.delete(l)
}

export const here = (): Venue => (current ??= stored())
export const use = (): Venue => useSyncExternalStore(watch, here, here)

/**
 * The chains this SITE reads, which is the tenant's own and no other.
 *
 * `VENUES` in `gov/chain.ts` is the registry: every chain this codebase knows
 * how to read. It is not a menu. lux.vote is Lux's governance and shows Lux's
 * chain, its figures and its mark; Zoo's chain belongs on zoo.vote, where Zoo's
 * mark and Zoo's word are. A site that lists four brands tells a reader they
 * are somewhere shared, and puts another network's addresses under this one's
 * name — which is the failure the tenant/registry distinction exists to
 * prevent, and it was on the deployment screen and in the header picker.
 *
 * The tenant's loopback chain rides with it under `pnpm dev`: it is this
 * tenant's chain on the machine reading it, and no other tenant's.
 */
export const roster = (): readonly Venue[] => {
  const mine = home()
  return VENUES.filter((v) => v.key === mine.key || v.key === `local-${mine.key}`)
}

export { VENUES }
