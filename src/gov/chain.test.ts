import { describe, expect, it } from 'vitest'
import { VENUES, venue } from './chain'

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
    // The segment is `chain`. `bc` was the older spelling of the same thing and
    // is gone from every validator, so a build still asking for it reaches
    // nothing — this is where that would be caught. The chain letter is either
    // case: luxd aliases both, and the estate writes it either way.
    //
    // What the rest of the pattern guards is the path form against the bare
    // host, which is the difference between a readable response and a CORS
    // refusal.
    for (const v of shipped)
      expect(v.rpc).toMatch(/^https:\/\/api\.[a-z-]+\.network\/v1\/chain\/[Cc]\/rpc$/)
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
