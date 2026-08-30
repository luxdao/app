import { describe, expect, it } from 'vitest'
import { duration, units } from './governance'

describe('duration', () => {
  it('reads a timestamp clock in wall-clock units', () => {
    expect(duration(86_400n, 'mode=timestamp')).toBe('1 day')
    expect(duration(604_800n, 'mode=timestamp')).toBe('7 days')
    expect(duration(3_600n, 'mode=timestamp')).toBe('1 hours')
  })

  /**
   * The distinction that was got wrong on this chain once already. 96369
   * produces a block on demand, so the same number is one day under a timestamp
   * clock and several months under a block clock — and a Governor pointed at a
   * token that does not override the clock is block-numbered.
   */
  it('does not convert a block count into time', () => {
    expect(duration(86_400n, 'mode=blocknumber')).toBe('86,400 blocks')
    expect(duration(604_800n, '')).toBe('604,800 blocks')
  })

  it('falls back to seconds rather than rounding a value away', () => {
    expect(duration(120n, 'mode=timestamp')).toBe('2 minutes')
    // 90 is not a whole number of minutes, so it stays in the unit it is exact in.
    expect(duration(90n, 'mode=timestamp')).toBe('90 seconds')
  })
})

describe('units', () => {
  it('renders vote units at the tallied token decimals', () => {
    expect(units(10n ** 26n, 18)).toBe('100,000,000')
    expect(units(4n * 10n ** 24n, 18)).toBe('4,000,000')
    expect(units(10n ** 20n, 18)).toBe('100')
  })

  it('keeps a small balance visible instead of rounding it to zero', () => {
    expect(units(10n ** 12n, 18)).toBe('0.000001')
  })

  it('reads zero as zero', () => {
    expect(units(0n, 18)).toBe('0')
  })
})
