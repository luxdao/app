import type { Slot, Venue } from '../gov/chain'
import { roster } from '../chrome/here'
import { client, presence, reader } from '../gov/client'
import { attempt, type Read } from '../gov/read'

/**
 * What is actually on each chain, against what the records say should be.
 *
 * This screen exists because the records disagree — with the chain and with
 * each other. The LPs state as a hard invariant that the Lux Governor is zero
 * bytes; it answers with fifteen thousand. Two files name two different
 * Bounties on Pars. A deployment table that is written by hand and read by
 * nobody drifts, so this one is not written at all: every row is an
 * `eth_getCode` performed when the screen opened.
 */

export interface Slotted {
  slot: Slot
  /** The address on record, or null when no record names one. */
  address: string | null
  /** Bytes of code at that address. 0 is a measurement, not a missing value. */
  size: number | null
  why: string | null
}

export interface Survey {
  venue: Venue
  chainId: number | null
  block: bigint | null
  reachable: boolean
  why: string | null
  slots: Slotted[]
}

const ORDER: Slot[] = [
  'governor', 'timelock', 'votes', 'karma', 'dlux', 've', 'votingLux', 'gauges', 'bounty', 'roles', 'safe',
]

/**
 * The contracts any DAO has a place for, and so a row on every chain even when
 * no record names one.
 *
 * The rest — `dlux`, `votingLux` — are one estate's own tokens. A "no record"
 * row for them on another tenant's chain puts that estate's names on this
 * site, so they appear only where the chain records them. An allowlist rather
 * than a list of exceptions: a slot added for one estate stays off the others
 * until somebody decides it belongs.
 */
const COMMON: ReadonlySet<Slot> = new Set([
  'governor', 'timelock', 'votes', 'karma', 've', 'gauges', 'bounty', 'roles', 'safe',
])

/** The rows a chain's survey has, in order. */
export const rows = (v: Venue): Slot[] => ORDER.filter((slot) => COMMON.has(slot) || v.at[slot] !== undefined)

export async function survey(v: Venue): Promise<Survey> {
  const c = client(v)
  const reach = await attempt(async () => ({
    chainId: await c.getChainId(),
    block: await c.getBlockNumber(),
  }))

  if (reach.at !== 'read') {
    return {
      venue: v, chainId: null, block: null, reachable: false,
      why: reach.at === 'failed' ? reach.why : 'unreachable',
      slots: rows(v).map((slot) => ({ slot, address: v.at[slot] ?? null, size: null, why: 'chain unreachable' })),
    }
  }

  const slots = await Promise.all(
    rows(v).map(async (slot): Promise<Slotted> => {
      const address = v.at[slot] ?? null
      if (!address) return { slot, address: null, size: null, why: 'no address on record' }
      const p = await presence(v, slot)
      if (p.at === 'read') return { slot, address, size: p.value.size, why: null }
      if (p.at === 'absent') return { slot, address, size: 0, why: null }
      return { slot, address, size: null, why: p.at === 'failed' ? p.why : 'unread' }
    }),
  )

  return { venue: v, chainId: reach.value.chainId, block: reach.value.block, reachable: true, why: null, slots }
}

/** Every chain this site reads — the tenant's, not the registry's. */
export const surveyAll = (): Promise<Survey[]> => Promise.all(roster().map(survey))

/** One line per chain, for a heading that should not overstate. */
export function verdict(s: Survey): string {
  if (!s.reachable) return 'not reachable'
  const live = s.slots.filter((x) => x.size !== null && x.size > 0).length
  const named = s.slots.filter((x) => x.address !== null).length
  if (named === 0) return 'no addresses on record'
  if (live === 0) return `nothing at any of the ${named} addresses on record`
  return `${live} of ${named} addresses on record carry code`
}
