import { describe, expect, it } from 'vitest'
import { TENANTS } from './tenants'

/**
 * The chains the stack's sites ship with. A node on this machine is declared
 * under `import.meta.env.DEV`, which is true here, so a test also sees each
 * tenant's `local` chain. Every claim below is about what ships; the local
 * chains are deliberately outside them, and reach a loopback address that no
 * gateway sits in front of.
 */
const shipped = TENANTS.map((b) => b.venue)

describe('the chains the three sites read', () => {
  it('is one chain per site', () => {
    expect(shipped.map((v) => v.id)).toEqual([96369, 200200, 36963])
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
    for (const v of shipped)
      expect(v.rpc).toMatch(/^https:\/\/api\.[a-z-]+\.network\/v1\/chain\/[Cc]\/rpc$/)
  })

  /** An address recorded twice under one slot would make two screens disagree. */
  it('records each address at most once per chain', () => {
    for (const v of [...shipped, ...TENANTS.flatMap((b) => (b.local ? [b.local] : []))]) {
      const at = Object.values(v.at).map((a) => a.toLowerCase())
      expect(new Set(at).size).toBe(at.length)
    }
  })
})
