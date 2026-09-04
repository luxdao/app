import * as abi from '../gov/abi'
import type { Slot, Venue } from '../gov/chain'
import { presence, reader } from '../gov/client'
import { attempt, type Read } from '../gov/read'

/**
 * Vote escrow: a lock, and the weight a lock carries while it runs down.
 *
 * This is the one place the interface reads an escrow, and it reads it through
 * an adapter rather than against a contract, because the estate has two shapes
 * of the same instrument and both are real:
 *
 *  - **`CURVE`** — `vLUX` in `luxfi/standard`. Locked balance and end, weight
 *    that decays linearly to zero at the end, no delegation. It is what is
 *    deployed on 96369 today, so it is the adapter this interface uses.
 *  - **`VOTES`** — the generic vote-escrow token being written into
 *    `luxfi/standard` as a votes token: the same lock, plus OpenZeppelin
 *    `IVotes`, so escrow weight can be delegated and a Governor can tally it on
 *    a timestamp clock. Not bound: it has no artifact and no address on any
 *    chain yet, and writing an ABI for a contract nobody has compiled would put
 *    a guess where a measurement belongs. Binding it is an `abi.ts` entry, a
 *    slot in `chain.ts`, and an object of this shape — nothing on the screen
 *    changes.
 *
 * A tenant that locks a different token binds a third; the screen does not know
 * which one it drew.
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
}

export interface Escrow {
  address: string
  /** The token that gets locked. */
  base: string
  name: string
  symbol: string
  decimals: number
  /** Base token the escrow holds. */
  locked: bigint
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
  /** Where `chain.ts` records this contract's address. */
  readonly slot: Slot
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
  add(amount: bigint): Call
  extend(end: bigint): Call
  close(): Call
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
export const CURVE: Ve = {
  slot: 'vlux',
  abi: abi.vlux,
  delegable: false,
  decays: true,

  async whole(ask) {
    const [base, name, symbol, decimals, locked, supply, min, max, step] = await Promise.all([
      ask<string>('lux'),
      ask<string>('name'),
      ask<string>('symbol'),
      ask<number>('decimals'),
      ask<bigint>('totalLocked'),
      ask<bigint>('totalSupply'),
      ask<bigint>('MIN_LOCK_TIME'),
      ask<bigint>('MAX_LOCK_TIME'),
      ask<bigint>('WEEK'),
    ])
    return { base, name, symbol, decimals, locked, supply, min, max, step }
  },

  async lockOf(ask, who) {
    const [held, power] = await Promise.all([
      ask<readonly [bigint, bigint]>('getLocked', [who]),
      ask<bigint>('balanceOf', [who]),
    ])
    return { amount: held[0], end: held[1], power }
  },

  open: (amount, end) => ({ functionName: 'createLock', args: [amount, end] }),
  add: (amount) => ({ functionName: 'increaseAmount', args: [amount] }),
  extend: (end) => ({ functionName: 'increaseUnlockTime', args: [end] }),
  close: () => ({ functionName: 'withdraw', args: [] }),
}

/** The escrow this build reads. One line to move a tenant onto another shape. */
export const VE: Ve = CURVE

export async function escrow(
  v: Venue,
  who: `0x${string}` | null,
  ve: Ve = VE,
): Promise<Read<Escrow>> {
  const here = await presence(v, ve.slot)
  if (here.at !== 'read') return here
  const address = here.value.address

  return attempt(async () => {
    const ask = reader(v, address, ve.abi)
    const whole = await ve.whole(ask)
    const mine = who ? await ve.lockOf(ask, who) : { amount: 0n, end: 0n, power: 0n }
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
