import { afterEach, describe, expect, it, vi } from 'vitest'

/**
 * A stored chain is a reader's choice among THIS site's chains. Storage the
 * page does not control — an old value, a hand edit — must not open another
 * estate's chain under this tenant's name.
 */
describe('the chain a site opens on', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
    vi.resetModules()
  })

  const open = async (home: string, saved: string | null) => {
    vi.stubEnv('VITE_VOTE_HOME', home)
    vi.stubGlobal('localStorage', { getItem: () => saved, setItem: () => {} })
    vi.resetModules()
    const { add } = await import('./brand')
    const { TENANTS } = await import('../tenants')
    add(...TENANTS)
    const { here } = await import('./here')
    return here().key
  }

  it('ignores a stored chain that belongs to another tenant', async () => {
    expect(await open('zoo', 'lux')).toBe('zoo')
    expect(await open('hanzo', 'pars')).toBe('hanzo')
  })

  it('opens the tenant chain when nothing is stored', async () => {
    expect(await open('lux', null)).toBe('lux')
  })

  it('keeps a stored chain the site reads', async () => {
    expect(await open('zoo', 'zoo')).toBe('zoo')
    expect(await open('zoo', 'local-zoo')).toBe('local-zoo')
  })

  it("ignores another tenant's loopback chain", async () => {
    expect(await open('zoo', 'local-lux')).toBe('zoo')
  })
})
