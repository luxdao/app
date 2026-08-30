import * as abi from '../gov/abi'
import type { Venue } from '../gov/chain'
import { client, presence, reader } from '../gov/client'
import { attempt, type Read } from '../gov/read'

/**
 * Voting power, which is not the same thing as a balance.
 *
 * An ERC20Votes balance carries no weight until it is delegated — to somebody
 * else or to yourself. A screen that shows a holder their balance and calls it
 * voting power tells them they can vote when they cannot, and on this chain
 * that is the live condition: the whole supply sits with one address that has
 * never delegated, so the delegated total is zero.
 */
export interface Power {
  token: string
  symbol: string
  decimals: number
  totalSupply: bigint
  /** Zero address means: held, never delegated, carrying no weight. */
  delegate: string
  balance: bigint
  votes: bigint
}

export const NOBODY = '0x0000000000000000000000000000000000000000'

export async function power(v: Venue, who: `0x${string}` | null): Promise<Read<Power>> {
  const here = await presence(v, 'votes')
  if (here.at !== 'read') return here
  const address = here.value.address

  return attempt(async () => {
    const one = reader(v, address, abi.votes)
    const [symbol, decimals, totalSupply] = await Promise.all([
      one<string>('symbol'), one<number>('decimals'), one<bigint>('totalSupply'),
    ])
    if (!who) {
      return { token: address, symbol, decimals, totalSupply, delegate: NOBODY, balance: 0n, votes: 0n }
    }
    const [delegate, balance, votes] = await Promise.all([
      one<string>('delegates', [who]), one<bigint>('balanceOf', [who]), one<bigint>('getVotes', [who]),
    ])
    return { token: address, symbol, decimals, totalSupply, delegate, balance, votes }
  })
}

/** vLUX — the vote-escrow lock, which is a separate instrument from the tally. */
export interface Escrow {
  address: string
  name: string
  symbol: string
  totalLocked: bigint
  totalSupply: bigint
  minLock: bigint
  maxLock: bigint
  locked: bigint
  until: bigint
}

export async function escrow(v: Venue, who: `0x${string}` | null): Promise<Read<Escrow>> {
  const here = await presence(v, 'vlux')
  if (here.at !== 'read') return here
  const address = here.value.address
  return attempt(async () => {
    const one = reader(v, address, abi.vlux)
    const [name, symbol, totalLocked, totalSupply, minLock, maxLock] = await Promise.all([
      one<string>('name'), one<string>('symbol'), one<bigint>('totalLocked'),
      one<bigint>('totalSupply'), one<bigint>('MIN_LOCK_TIME'), one<bigint>('MAX_LOCK_TIME'),
    ])
    const mine = who
      ? await one<readonly [bigint, bigint]>('getLocked', [who])
      : ([0n, 0n] as const)
    return { address, name, symbol, totalLocked, totalSupply, minLock, maxLock, locked: mine[0], until: mine[1] }
  })
}
