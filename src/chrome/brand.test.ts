import { describe, expect, it, vi } from 'vitest'
import { BRANDS, type Brand, brand, home, tenant } from './brand'

describe('the tenants this bundle serves', () => {
  it('is lux, zoo and hanzo', () => {
    expect(BRANDS.map((b) => b.key)).toEqual(['lux', 'zoo', 'hanzo'])
  })

  /**
   * The failure this guards is the one a reader cannot detect: a site that
   * opens on somebody else's Governor shows real figures under the wrong name.
   */
  it('opens each tenant on its own chain', () => {
    expect(BRANDS.map((b) => [b.key, b.venue.id])).toEqual([
      ['lux', 96369],
      ['zoo', 200200],
      ['hanzo', 36963],
    ])
  })

  /**
   * The mark either says the name or it does not, and the word beside it makes
   * up the difference. The Lux mark is the letters L and X; the other two are
   * glyphs. A lockup reading "Lux Lux Vote" is what this stops.
   */
  /**
   * The glyph beside the word is a shape and says nothing, so the word carries
   * the estate and the app both. It was "Vote" beside a wordmark that spelled
   * LUX; a glyph cannot spell anything, and a header reading "Vote" says which
   * app and not whose.
   */
  it('says the estate and the app, because the glyph says neither', () => {
    expect(BRANDS.map((b) => b.word)).toEqual(['Lux Vote', 'Zoo Vote', 'Hanzo Vote'])
    for (const b of BRANDS) expect(b.word.startsWith(b.name)).toBe(true)
  })

  /** The header drops the leading half as a reader scrolls, so every tenant's
   *  word has one to drop and lands on the app's own name. */
  it('collapses to the app', () => {
    for (const b of BRANDS) expect(b.word.split(' ').at(-1)).toBe('Vote')
  })
})

describe('a host names its tenant', () => {
  it('reads the bare host', () => {
    expect(tenant('lux.vote')?.key).toBe('lux')
    expect(tenant('zoo.vote')?.key).toBe('zoo')
    expect(tenant('hanzo.vote')?.key).toBe('hanzo')
  })

  /** The tenant is not always the first label, so every label is read. */
  it('reads a host that carries the tenant further in', () => {
    expect(tenant('www.hanzo.vote')?.key).toBe('hanzo')
    expect(tenant('vote.zoo.network')?.key).toBe('zoo')
  })

  it('names no tenant for a host that belongs to nobody', () => {
    expect(tenant('localhost')).toBeUndefined()
    expect(tenant('127.0.0.1')).toBeUndefined()
    expect(tenant('pars.vote')).toBeUndefined()
  })

  /**
   * A fork adds a tenant by extending the list rather than by changing how any
   * of this works — which is how pars.vote is served from a fork of this source
   * without Pars being declared here.
   */
  it('resolves against a list a fork extends', () => {
    const lux = BRANDS[0]!
    const mine: Brand[] = [...BRANDS, { ...lux, key: 'elsewhere', name: 'Elsewhere' }]
    expect(tenant('elsewhere.vote', mine)?.name).toBe('Elsewhere')
    expect(tenant('elsewhere.vote')).toBeUndefined()
  })
})

/**
 * Under vitest there is no document, so no host names a tenant and the build's
 * own answer is what is left — which is the same path a preview URL or a bare
 * address takes in a browser.
 */
describe('with no host to read', () => {
  it('falls back to the tenant the build was told to be', () => {
    expect(brand().key).toBe('lux')
    expect(home().id).toBe(96369)
  })
})

/**
 * What a fork does, and the failure the timing guard is for.
 *
 * The modules are reloaded for each case because the choice is made once and
 * kept: that is the point of it, and a test that shared one would be measuring
 * whichever case ran first.
 */
describe('a fork adding its own site', () => {
  it('serves the fork\'s tenant when the build names it', async () => {
    vi.resetModules()
    vi.stubEnv('VITE_VOTE_HOME', 'elsewhere')
    const m = await import('./brand')
    const lux = m.BRANDS[0]!
    m.add({ ...lux, key: 'elsewhere', name: 'Elsewhere', word: 'Elsewhere Vote' })
    expect(m.brands().map((b) => b.key)).toEqual(['lux', 'zoo', 'hanzo', 'elsewhere'])
    expect(m.brand().name).toBe('Elsewhere')
    vi.unstubAllEnvs()
  })

  it('refuses a tenant added after the site has been decided', async () => {
    vi.resetModules()
    const m = await import('./brand')
    expect(m.brand().key).toBe('lux')
    const lux = m.BRANDS[0]!
    expect(() => m.add({ ...lux, key: 'late' })).toThrow(/after the site had already been decided/)
  })
})
