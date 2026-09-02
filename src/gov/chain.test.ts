import { describe, expect, it } from 'vitest'
import { HOME, VENUES, venue } from './chain'

/**
 * The venues a build ships with. A node on this machine is compiled in under
 * `import.meta.env.DEV`, which is true here, so the registry seen by a test is
 * one entry longer than the one seen by a reader. Every claim below is about
 * what ships; the local entry is deliberately outside them, and reaches a
 * loopback address that no gateway sits in front of.
 */
const shipped = VENUES.filter((v) => v.key !== 'local')

describe('the chain registry', () => {
  it('carries the four chains this interface reads', () => {
    expect(shipped.map((v) => v.id).sort((a, b) => a - b)).toEqual([36963, 96369, 200200, 494949])
  })

  /**
   * The bare host serves the same chain to curl and refuses a browser: its
   * gateway answers the CORS preflight with 405 and sends no
   * `access-control-allow-origin`. That arrives as a network error with no
   * chain in it, so every screen would report the Governor unreadable while the
   * Governor was fine.
   */
  it('reaches every chain by the path form, which is the one a browser may read', () => {
    // Either segment. What this guards is the path form against the bare host,
    // which is the difference between a readable response and a CORS refusal;
    // whether the segment says `bc` or `chain` is a fact about which luxd the
    // validators are running, and pinning it here means this fails on a
    // deployment move rather than on the mistake it exists to catch.
    for (const v of shipped)
      expect(v.rpc).toMatch(/^https:\/\/api\.[a-z-]+\.network\/v1\/(?:bc|chain)\/C\/rpc$/)
  })

  it('opens on Lux mainnet', () => {
    expect(HOME.id).toBe(96369)
  })

  it('finds a chain by key and reports nothing for one it does not have', () => {
    expect(venue('lux')?.id).toBe(96369)
    expect(venue('ethereum')).toBeUndefined()
  })

  /** An address recorded twice under one slot would make two screens disagree. */
  it('records each address at most once per chain', () => {
    for (const v of VENUES) {
      const at = Object.values(v.at).map((a) => a.toLowerCase())
      expect(new Set(at).size).toBe(at.length)
    }
  })
})
