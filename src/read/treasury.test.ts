import { describe, expect, it, vi } from 'vitest'
import { absent, read } from '../gov/read'

const TIMELOCK = '0x62617aB01F263ce2b8432065b6d1d8D031665c74'
const SAFE = '0x4CB86Cbb76Ed31E68825F9e24480EEdF5B9b1951'

// Every address holds a balance, so the chain cannot be asked whether something
// is a holding — only whether it exists. These stubs answer presence per slot
// and hand every balance back as 1, so a holding that appears is one the rule
// admitted rather than one that happened to carry coin.
const stub = (safe: ReturnType<typeof absent>) => {
  vi.doMock('../gov/client', () => ({
    client: () => ({ getBalance: async () => 1n }),
    presence: async (_v: unknown, slot: string) =>
      slot === 'timelock' ? read({ address: TIMELOCK, size: 9 }) : safe,
    reader: () => async (fn: string) => (fn === 'getMinDelay' ? 0n : fn.endsWith('_ROLE') ? '0x00' : false),
  }))
}

const venue = { id: 96369, key: 'lux', at: {} } as never

describe('treasury holdings', () => {
  it('counts a Safe that exists', async () => {
    vi.resetModules()
    stub(read({ address: SAFE, size: 114 }))
    const { treasury } = await import('./treasury')
    const t = await treasury(venue)
    expect(t.at).toBe('read')
    if (t.at !== 'read') return
    expect(t.value.holdings.map((h) => h.what)).toEqual(['Timelock', 'DAO Safe'])
  })

  // The case three of four venues were in: an address on record, zero bytes on
  // the chain. Reported as a holding it is a claim about the treasury that no
  // measurement supports.
  it('does not count a Safe that is only on record', async () => {
    vi.resetModules()
    stub(absent(SAFE))
    const { treasury } = await import('./treasury')
    const t = await treasury(venue)
    expect(t.at).toBe('read')
    if (t.at !== 'read') return
    expect(t.value.holdings.map((h) => h.what)).toEqual(['Timelock'])
  })
})
