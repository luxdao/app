import { describe, expect, it } from 'vitest'
import { BRAND, BRANDS, HOME, type Brand, tenant } from './brand'

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
  it('never writes a name the mark already carries', () => {
    expect(BRANDS.map((b) => b.word)).toEqual(['Vote', 'Zoo Vote', 'Hanzo Vote'])
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
    expect(BRAND.key).toBe('lux')
    expect(HOME.id).toBe(96369)
  })
})
