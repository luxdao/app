import { useSyncExternalStore } from 'react'
import { VENUES, venue, type Venue } from '../gov/chain'
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

function stored(): Venue {
  try {
    const k = localStorage.getItem(KEY)
    return (k && venue(k)) || home()
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
export { VENUES }
