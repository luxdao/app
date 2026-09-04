import { describe, expect, it } from 'vitest'
import { DAY, VOTES, WEEK, decay, ends, expired, left, round } from './ve'

const YEAR = 52n * WEEK // 52 weeks = MAX / 4: the escrow is week-aligned with a 208-week maximum
/** 208 weeks, which is what `MAX_LOCK` answers. */
const MAX = 208n * WEEK
const MIN = WEEK
/** A round number standing in for "now". Nothing here depends on the wall clock. */
const NOW = 1_800_000_000n

describe('left', () => {
  it('counts the seconds a lock still has to run', () => {
    expect(left(NOW + YEAR, NOW)).toBe(YEAR)
  })

  /**
   * An expired lock has no time left, not negative time. Subtracting past the
   * end underflows a bigint into an enormous positive number, which would draw
   * as a lock with a hundred billion years to run.
   */
  it('floors at zero rather than running backwards', () => {
    expect(left(NOW - YEAR, NOW)).toBe(0n)
    expect(left(0n, NOW)).toBe(0n)
  })
})

describe('expired', () => {
  it('is true only of a lock that exists and has ended', () => {
    expect(expired(NOW - 1n, NOW)).toBe(true)
    expect(expired(NOW + 1n, NOW)).toBe(false)
  })

  /** No lock is not an expired lock, and the withdraw button turns on this. */
  it('is false when there is no lock at all', () => {
    expect(expired(0n, NOW)).toBe(false)
  })
})

describe('decay', () => {
  /** The ratio the contract's own header states, at the three points it states. */
  it('is the straight line the escrow describes', () => {
    const thousand = 1000n * 10n ** 18n
    expect(decay(thousand, NOW + MAX, NOW, MAX)).toBe(thousand)
    expect(decay(thousand, NOW + YEAR, NOW, MAX)).toBe(thousand / 4n)
    expect(decay(thousand, NOW + WEEK, NOW, MAX)).toBe((thousand * WEEK) / MAX)
  })

  it('reaches zero at the end and stays there', () => {
    expect(decay(1000n, NOW, NOW, MAX)).toBe(0n)
    expect(decay(1000n, NOW - YEAR, NOW, MAX)).toBe(0n)
  })

  /** A contract that answered zero for its own maximum would divide by it. */
  it('answers zero rather than dividing by an unread maximum', () => {
    expect(decay(1000n, NOW + YEAR, NOW, 0n)).toBe(0n)
  })
})

describe('round', () => {
  it('floors to the step, the way the contract stores an end', () => {
    expect(round(NOW, WEEK)).toBe((NOW / WEEK) * WEEK)
    expect(round(3n * WEEK, WEEK)).toBe(3n * WEEK)
  })

  it('leaves the value alone when the contract rounds nothing', () => {
    expect(round(NOW, 0n)).toBe(NOW)
  })
})

describe('ends', () => {
  /**
   * The case that reverts if the rounding goes the other way. `createLock`
   * floors the end to a week and then demands the floored end still clear
   * `now + MIN_LOCK_TIME`, so the advertised minimum, asked for exactly, is
   * refused unless "now" happens to sit on a week boundary.
   */
  it('gives the shortest lock an end the contract will accept', () => {
    const end = ends(NOW, MIN, MIN, MAX, WEEK)
    expect(end % WEEK).toBe(0n)
    expect(end).toBeGreaterThanOrEqual(NOW + MIN)
    expect(end).toBeLessThanOrEqual(NOW + MAX)
  })

  it('keeps the longest lock inside the maximum', () => {
    const end = ends(NOW, MAX, MIN, MAX, WEEK)
    expect(end % WEEK).toBe(0n)
    expect(end).toBeLessThanOrEqual(NOW + MAX)
    // A step back is the whole cost of staying inside the bound.
    expect(end).toBeGreaterThan(NOW + MAX - WEEK)
  })

  it('clamps a span outside the bounds instead of passing it on', () => {
    expect(ends(NOW, 1n, MIN, MAX, WEEK)).toBe(ends(NOW, MIN, MIN, MAX, WEEK))
    expect(ends(NOW, 100n * YEAR, MIN, MAX, WEEK)).toBe(ends(NOW, MAX, MIN, MAX, WEEK))
  })

  it('asks for the span exactly when the contract rounds nothing', () => {
    expect(ends(NOW, YEAR, MIN, MAX, 0n)).toBe(NOW + YEAR)
  })

  /** Every week between the bounds has to produce an end that is accepted. */
  it('holds for every week of the range', () => {
    for (let w = 1n; w <= 208n; w++) {
      const end = ends(NOW, w * WEEK, MIN, MAX, WEEK)
      expect(end % WEEK).toBe(0n)
      expect(end).toBeGreaterThanOrEqual(NOW + MIN)
      expect(end).toBeLessThanOrEqual(NOW + MAX)
    }
  })
})

describe('the escrow this build binds', () => {
  it('finds its address through the register rather than being handed one', () => {
    expect(typeof VOTES.where).toBe('function')
  })

  it('says weight falls, because on this one it does', () => {
    expect(VOTES.decays).toBe(true)
  })

  it('offers delegation, because the escrow is a votes token', () => {
    expect(VOTES.delegable).toBe(true)
    expect(VOTES.delegate?.('0x0').functionName).toBe('delegate')
  })

  /**
   * Creating, enlarging and extending are one call with one argument zeroed. A
   * lock is a single `(amount, end)` pair and `lock` sets both, so an adapter
   * naming three functions would be naming two that do not exist.
   */
  it('opens, adds and extends through the one call the contract has', () => {
    expect(VOTES.open(1n, NOW).functionName).toBe('lock')
    expect(VOTES.add?.(5n)).toEqual({ functionName: 'lock', args: [5n, 0n] })
    expect(VOTES.extend?.(NOW).args[0]).toBe(0n)
    expect(VOTES.close(0n)).toEqual({ functionName: 'withdraw', args: [] })
  })

  /**
   * The screen works in ends; the contract works in durations from now. A
   * duration that has already passed is zero rather than negative — and zero
   * is the call that adds at the current end rather than one that reverts.
   */
  it('turns an end into a duration, and a passed end into none', () => {
    const soon = BigInt(Math.floor(Date.now() / 1000)) + 3600n
    expect(VOTES.open(1n, soon).args[1]).toBeGreaterThan(0n)
    expect(VOTES.open(1n, 1n).args[1]).toBe(0n)
  })

  /** Every call the adapter names has to be in the ABI it is signed against. */
  it('signs every call against a member of its own ABI', () => {
    const names = new Set((VOTES.abi as { name?: string }[]).map((m) => m.name))
    for (const call of [
      VOTES.open(1n, NOW),
      VOTES.add!(1n),
      VOTES.extend!(NOW),
      VOTES.close(0n),
      VOTES.delegate!('0x0'),
    ]) {
      expect(names).toContain(call.functionName)
    }
  })

  /** No transfer and no approve: dispatch reverts, so neither is decodable here. */
  it('carries no transfer surface, because the contract has none', () => {
    const names = (VOTES.abi as { name?: string }[]).map((m) => m.name)
    expect(names).not.toContain('transfer')
    expect(names).not.toContain('approve')
  })
})
