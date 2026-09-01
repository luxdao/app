import { describe, expect, it } from 'vitest'
import { HOME, VENUES, venue } from './chain'

describe('the chain registry', () => {
  it('carries the four chains this interface reads', () => {
    expect(VENUES.map((v) => v.id).sort((a, b) => a - b)).toEqual([36963, 96369, 200200, 494949])
  })

  /**
   * The bare host serves the same chain to curl and refuses a browser: its
   * gateway answers the CORS preflight with 405 and sends no
   * `access-control-allow-origin`. That arrives as a network error with no
   * chain in it, so every screen would report the Governor unreadable while the
   * Governor was fine.
   */
  it('reaches every chain by the path form, which is the one a browser may read', () => {
    for (const v of VENUES) expect(v.rpc).toMatch(/^https:\/\/api\.[a-z]+\.network\/v1\/chain\/C\/rpc$/)
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
