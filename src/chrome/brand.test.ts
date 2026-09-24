import { afterEach, describe, expect, it, vi } from 'vitest'
import { TENANTS } from '../tenants'
import { type Brand, tenant } from './brand'

describe('the tenants this repository builds', () => {
  it('is lux, zoo and hanzo', () => {
    expect(TENANTS.map((b) => b.key)).toEqual(['lux', 'zoo', 'hanzo'])
  })

  /**
   * The failure this guards is the one a reader cannot detect: a site that
   * opens on somebody else's Governor shows real figures under the wrong name.
   */
  it('opens each tenant on its own chain', () => {
    expect(TENANTS.map((b) => [b.key, b.venue.key, b.venue.id])).toEqual([
      ['lux', 'lux', 96369],
      ['zoo', 'zoo', 200200],
      ['hanzo', 'hanzo', 36963],
    ])
  })

  /**
   * The glyph beside the word is a shape and says nothing, so the word carries
   * the estate and the app both. It was "Vote" beside a wordmark that spelled
   * LUX; a glyph cannot spell anything, and a header reading "Vote" says which
   * app and not whose.
   */
  it('says the estate and the app, because the glyph says neither', () => {
    expect(TENANTS.map((b) => b.word)).toEqual(['Lux Vote', 'Zoo Vote', 'Hanzo Vote'])
    for (const b of TENANTS) expect(b.word.startsWith(b.name)).toBe(true)
  })

  /** The header drops the leading half as a reader scrolls, so every tenant's
   *  word has one to drop and lands on the app's own name. */
  it('collapses to the app', () => {
    for (const b of TENANTS) expect(b.word.split(' ').at(-1)).toBe('Vote')
  })

  /** A tenant's loopback chain is its own, under the tenant's own key. */
  it('keeps each loopback chain with its own tenant', () => {
    expect(TENANTS.map((b) => b.local?.key)).toEqual(['local-lux', 'local-zoo', 'local-hanzo'])
  })
})

describe('a host names its tenant', () => {
  it('reads the bare host', () => {
    expect(tenant('lux.vote', TENANTS)?.key).toBe('lux')
    expect(tenant('zoo.vote', TENANTS)?.key).toBe('zoo')
    expect(tenant('hanzo.vote', TENANTS)?.key).toBe('hanzo')
  })

  /** The tenant is not always the first label, so every label is read. */
  it('reads a host that carries the tenant further in', () => {
    expect(tenant('www.hanzo.vote', TENANTS)?.key).toBe('hanzo')
    expect(tenant('vote.zoo.network', TENANTS)?.key).toBe('zoo')
  })

  it('names no tenant for a host that belongs to nobody', () => {
    expect(tenant('localhost', TENANTS)).toBeUndefined()
    expect(tenant('127.0.0.1', TENANTS)).toBeUndefined()
    expect(tenant('pars.vote', TENANTS)).toBeUndefined()
  })

  /**
   * A host resolves only against what the build registered. A bundle that was
   * given one tenant cannot be talked into being another by the name it is
   * reached under — `lux.pars.example` serving pars.vote's bundle is Pars.
   */
  it('resolves against the tenants registered, and no others', () => {
    const pars: Brand = { ...TENANTS[0]!, key: 'pars', name: 'Pars', word: 'Pars Vote' }
    expect(tenant('lux.vote', [pars])).toBeUndefined()
    expect(tenant('pars.vote', [pars])?.name).toBe('Pars')
  })
})

/**
 * What an entry does, and the failure the timing guard is for.
 *
 * The modules are reloaded for each case because the choice is made once and
 * kept: that is the point of it, and a test that shared one would be measuring
 * whichever case ran first. Under vitest there is no document, so no host names
 * a tenant and the build's own answer is what is left — which is the same path a
 * preview URL or a bare address takes in a browser.
 */
describe('an entry registering its sites', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it('serves nothing it was not given', async () => {
    vi.resetModules()
    const m = await import('./brand')
    expect(m.brands()).toEqual([])
    expect(() => m.brand()).toThrow(/not a tenant/)
  })

  it('falls back to the tenant the build was told to be', async () => {
    vi.resetModules()
    const m = await import('./brand')
    m.add(...TENANTS)
    expect(m.brand().key).toBe('lux')
    expect(m.home().id).toBe(96369)
  })

  it("serves a fork's tenant, and only it, when the fork's entry adds it", async () => {
    vi.resetModules()
    vi.stubEnv('VITE_VOTE_HOME', 'elsewhere')
    const m = await import('./brand')
    m.add({ ...TENANTS[0]!, key: 'elsewhere', name: 'Elsewhere', word: 'Elsewhere Vote' })
    expect(m.brands().map((b) => b.key)).toEqual(['elsewhere'])
    expect(m.brand().name).toBe('Elsewhere')
  })

  it('refuses a tenant added after the site has been decided', async () => {
    vi.resetModules()
    const m = await import('./brand')
    m.add(...TENANTS)
    expect(m.brand().key).toBe('lux')
    expect(() => m.add({ ...TENANTS[0]!, key: 'late' })).toThrow(/after the site had already been decided/)
  })
})
