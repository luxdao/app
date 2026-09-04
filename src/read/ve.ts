import type { Address } from 'viem'
import * as abi from '../gov/abi'
import type { Venue } from '../gov/chain'
import { presence, reader } from '../gov/client'
import { attempt, type Read } from '../gov/read'

/**
 * Vote escrow: a lock, and the weight a lock carries while it runs down.
 *
 * This is the one place the interface reads an escrow, and it reads it through
 * an adapter rather than against a contract, because the same instrument has
 * more than one shape in the estate. `VOTES` binds the one `luxfi/standard`
 * ships — `VeVotes`, at the `vlux` slot, which is where the venue register
 * points now that the Curve-style contract that stood there has been removed as
 * a duplicate.
 *
 * A tenant that locks a different token binds another adapter; the screen does
 * not know which one it drew.
 */

/** A bound reader, as `reader()` hands one back. */
type Ask = ReturnType<typeof reader>

/** A call the screen will ask a wallet to sign. */
export interface Call {
  functionName: string
  args: readonly unknown[]
}

/** One account's lock, in the terms every escrow states it in. */
export interface Lock {
  /** Base token under lock. Zero means no lock. */
  amount: bigint
  /** Unix seconds the lock ends. Zero means no lock. */
  end: bigint
  /** The weight the contract reports for this account right now. */
  power: bigint
  /**
   * The weight a Governor would tally, which is not the same number.
   *
   * Power is what the lock is worth; votes are what has been delegated. On an
   * escrow that is a votes token they differ by exactly one transaction, and
   * that transaction is the one holders do not know they have to send. Null on
   * an escrow with no delegation, where the distinction does not exist.
   */
  votes: bigint | null
  /** Zero address means: held, never delegated, carrying no vote. */
  delegate: string | null
}

export interface Escrow {
  address: string
  /** The token that gets locked. */
  base: string
  name: string
  symbol: string
  decimals: number
  /**
   * Base token the escrow holds, or null when the contract keeps no total.
   *
   * Null rather than zero. An escrow that never counts its deposits and an
   * escrow that holds nothing are different facts, and rendering the first as
   * "0 locked" states the second.
   */
  locked: bigint | null
  /** Weight outstanding across every lock. */
  supply: bigint
  /** Shortest and longest lock, in seconds. */
  min: bigint
  max: bigint
  /** What a lock end is rounded down to. Zero when the contract rounds nothing. */
  step: bigint
  /** Whether escrow weight can be pointed at another address. */
  delegable: boolean
  mine: Lock
}

export interface Ve {
  /**
   * Where this escrow is on a venue, and whether anything is there.
   *
   * A function rather than a slot in `chain.ts`, because a fork's escrow is not
   * in this repository's register: it keeps its own, and the answer this
   * returns is the same four-state reading either way.
   */
  where(v: Venue): Promise<Read<{ address: Address; size: number }>>
  readonly abi: readonly unknown[]
  readonly delegable: boolean
  /**
   * Whether weight falls as the lock runs down.
   *
   * Both kinds exist. A Curve-style escrow mints a bias and a slope, so weight
   * is a straight line to zero and a lock is worth what is left of it. An
   * escrow that mints a multiple of the deposit at the moment of locking gives
   * weight that does not move until the lock ends and the tokens come out.
   * Saying the second decays would tell a holder their weight is falling when
   * it is not, so the screen asks rather than assumes.
   */
  readonly decays: boolean
  /** Everything true of the contract rather than of one account. */
  whole(ask: Ask): Promise<Omit<Escrow, 'address' | 'mine' | 'delegable'>>
  lockOf(ask: Ask, who: `0x${string}`): Promise<Lock>
  open(amount: bigint, end: bigint): Call
  /**
   * Add to a running lock, and lengthen one. Optional, because not every
   * escrow has them: an escrow whose only call is `stake` cannot add without
   * moving the end, and a screen that offered the button would offer a
   * transaction that shortens the lock it was meant to grow.
   */
  add?(amount: bigint): Call
  extend?(end: bigint): Call
  /** Point this account's weight at an address. Present when `delegable`. */
  delegate?(to: string): Call
  /**
   * End the lock. Takes the weight being burned, because an escrow that mints
   * a balance burns one; an escrow that keeps a locked balance ignores it and
   * returns the deposit whole.
   */
  close(power: bigint): Call
}

/**
 * The Curve-style escrow: `createLock`, `increaseAmount`, `increaseUnlockTime`,
 * `withdraw`, and a weight that is a straight line to zero.
 *
 * `WEEK` is the rounding, and it is not cosmetic: `createLock` floors the end
 * to a week boundary, so a lock asked for at the maximum is always slightly
 * short of it and never mints the whole ratio the comments in the contract
 * describe. The screen reads the step and says so rather than rounding up.
 */
export const VOTES: Ve = {
  where: (v) => presence(v, 'vlux'),
  abi: abi.ve,
  delegable: true,
  decays: true,

  async whole(ask) {
    const [base, name, symbol, decimals, locked, supply, min, max, step] = await Promise.all([
      ask<string>('underlying'),
      ask<string>('name'),
      ask<string>('symbol'),
      ask<number>('decimals'),
      ask<bigint>('totalLocked'),
      ask<bigint>('totalSupply'),
      ask<bigint>('MIN_LOCK'),
      ask<bigint>('MAX_LOCK'),
      ask<bigint>('WEEK'),
    ])
    return { base, name, symbol, decimals, locked, supply, min, max, step }
  },

  async lockOf(ask, who) {
    const [held, power, votes, delegate] = await Promise.all([
      ask<readonly [bigint, bigint]>('locks', [who]),
      ask<bigint>('balanceOf', [who]),
      ask<bigint>('getVotes', [who]),
      ask<string>('delegates', [who]),
    ])
    return { amount: held[0], end: held[1], power, votes, delegate }
  },

  /**
   * `lock(amount, duration)` is create, enlarge and extend at once, because a
   * lock is one `(amount, end)` pair and the call sets both. Duration is
   * measured from now and never shortens the end, so the three calls below are
   * the same function with one of its arguments zeroed.
   */
  open: (amount, end) => ({ functionName: 'lock', args: [amount, span(end)] }),
  add: (amount) => ({ functionName: 'lock', args: [amount, 0n] }),
  extend: (end) => ({ functionName: 'lock', args: [0n, span(end)] }),
  close: () => ({ functionName: 'withdraw', args: [] }),
  delegate: (to) => ({ functionName: 'delegate', args: [to] }),
}

/**
 * The end the screen asks for, as the duration the contract takes.
 *
 * The screen works in ends because an end is what a reader sees; the contract
 * works in durations from now. One conversion, here, rather than in three
 * callers — and floored at zero, because a duration that has already passed is
 * `lock(amount, 0)`, which adds at the current end rather than reverting.
 */
const span = (end: bigint): bigint => {
  const now = BigInt(Math.floor(Date.now() / 1000))
  return end > now ? end - now : 0n
}

/** The escrow this build reads. One line to move a tenant onto another shape. */
export const VE: Ve = VOTES

export async function escrow(
  v: Venue,
  who: `0x${string}` | null,
  ve: Ve = VE,
): Promise<Read<Escrow>> {
  const here = await ve.where(v)
  if (here.at !== 'read') return here
  const address = here.value.address

  return attempt(async () => {
    const ask = reader(v, address, ve.abi)
    const whole = await ve.whole(ask)
    const mine = who
      ? await ve.lockOf(ask, who)
      : { amount: 0n, end: 0n, power: 0n, votes: null, delegate: null }
    return { address, ...whole, delegable: ve.delegable, mine }
  })
}

/**
 * What the holder has of the token the escrow locks, and how much of it the
 * escrow is allowed to take.
 *
 * Read separately from the escrow because it is a different contract and a
 * different failure: a lock refused for want of an approval is the commonest
 * way a working escrow looks broken, and it is invisible unless the allowance
 * is on the screen.
 */
export interface Holding {
  token: string
  symbol: string
  decimals: number
  balance: bigint
  allowance: bigint
}

export async function holding(
  v: Venue,
  token: `0x${string}`,
  who: `0x${string}`,
  spender: `0x${string}`,
): Promise<Read<Holding>> {
  return attempt(async () => {
    const ask = reader(v, token, abi.erc20)
    const [symbol, decimals, balance, allowance] = await Promise.all([
      ask<string>('symbol'),
      ask<number>('decimals'),
      ask<bigint>('balanceOf', [who]),
      ask<bigint>('allowance', [who, spender]),
    ])
    return { token, symbol, decimals, balance, allowance }
  })
}

/** Seconds a lock still has to run. Never negative — an expired lock has none. */
export const left = (end: bigint, now: bigint): bigint => (end > now ? end - now : 0n)

export const expired = (end: bigint, now: bigint): boolean => end > 0n && end <= now

/**
 * The weight a lock should carry, from the lock alone.
 *
 * `amount * remaining / max`, which is what the contract's own checkpoint
 * arithmetic comes to between checkpoints. It is computed here so the screen
 * can show it beside the weight the contract reports: the two agreeing is the
 * only evidence a reader has that the decay is running, and the two diverging
 * is worth seeing rather than hiding behind whichever number was printed.
 */
export const decay = (amount: bigint, end: bigint, now: bigint, max: bigint): bigint =>
  max <= 0n ? 0n : (amount * left(end, now)) / max

/** A lock end as the contract will store it, floored to its step. */
export const round = (end: bigint, step: bigint): bigint => (step <= 0n ? end : (end / step) * step)

/**
 * The end to ask for, for a lock of `span` seconds opened now.
 *
 * The step is rounded **up**, which looks like the wrong direction until you
 * read what the contract does with it. `createLock` floors the end to a week
 * and then requires the floored end to still clear `now + MIN_LOCK_TIME` — so
 * the shortest lock the contract advertises, asked for exactly, reverts on all
 * but one day of the week. Rounding up first is what makes the advertised
 * minimum a lock a person can actually open. At the other end the ceiling can
 * carry a maximum-length lock a week past `MAX_LOCK_TIME`, which reverts the
 * other way, so that case steps back once.
 */
export function ends(now: bigint, span: bigint, min: bigint, max: bigint, step: bigint): bigint {
  const held = span < min ? min : span > max ? max : span
  const want = now + held
  if (step <= 0n) return want
  const up = ((want + step - 1n) / step) * step
  return up > now + max ? up - step : up
}

export const DAY = 86_400n
export const WEEK = 604_800n
