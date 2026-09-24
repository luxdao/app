import { afterEach, describe, expect, it, vi } from 'vitest'
import { BRANDS } from './brand'
import { client, config, did, host, linked, wallets, was } from './id'

describe('a tenant signs in at its own IAM', () => {
  /**
   * The failure this guards is a white-label violation and a credential sent to
   * the wrong party: a Zoo reader shown "Sign in to Hanzo" and typing a password
   * into it. The values are the estate's, from `hanzo/cloud/brand`.
   */
  it('names one issuer per tenant', () => {
    expect(BRANDS.map((b) => [b.key, b.issuer])).toEqual([
      ['lux', 'https://lux.id'],
      ['zoo', 'https://zoolabs.id'],
      ['hanzo', 'https://hanzo.id'],
    ])
  })

  /** An issuer is compared as a literal string, so a trailing slash is a different issuer. */
  it('records every issuer as an origin, with nothing after it', () => {
    for (const b of BRANDS) expect(b.issuer).toMatch(/^https:\/\/[a-z.]+$/)
  })

  /** `<org>-<app>`, HIP-0111, derived from the tenant rather than listed beside it. */
  it('derives the client id from the tenant', () => {
    expect(BRANDS.map((b) => client(b))).toEqual(['lux-vote', 'zoo-vote', 'hanzo-vote'])
  })

  it('says which host a credential is going to', () => {
    expect(BRANDS.map((b) => host(b.issuer))).toEqual(['lux.id', 'zoolabs.id', 'hanzo.id'])
  })

  /**
   * One callback path across the estate, and the one each org's IAM
   * provisioning derives for an app of type `spa`. A client that asks for a
   * redirect its registration does not carry is refused at the authorize
   * endpoint, before anybody types anything.
   */
  it('asks to be returned to the callback this app is registered for', () => {
    for (const b of BRANDS) {
      const c = config(b, `https://${b.key}.vote`)
      expect(c.serverUrl).toBe(b.issuer)
      expect(c.clientId).toBe(`${b.key}-vote`)
      expect(c.redirectUri).toBe(`https://${b.key}.vote/auth/callback`)
      expect(c.scope).toBe('openid profile email')
    }
  })

  /** No secret, because a browser cannot keep one. PKCE is what proves the client. */
  it('carries no client secret', () => {
    expect(config(BRANDS[0]!, 'https://lux.vote')).not.toHaveProperty('clientSecret')
  })
})

describe('the wallets claim', () => {
  /**
   * Absent is not empty. A token minted before the claim existed says nothing
   * about wallets, and rendering that as "this account has none" is a statement
   * IAM never made.
   */
  it('reports nothing when the claim is absent', () => {
    expect(wallets(undefined)).toBeNull()
    expect(wallets(null)).toBeNull()
    expect(wallets('0x0000000000000000000000000000000000000001')).toBeNull()
    expect(wallets({ address: '0x0000000000000000000000000000000000000001' })).toBeNull()
  })

  it('reports none when the claim is an empty list', () => {
    expect(wallets([])).toEqual([])
  })

  it('reads a chain and an address', () => {
    expect(wallets([{ chain: 'lux', address: '0x9011E888251AB053B7bD1cdB598Db4f9DEd94714' }])).toEqual([
      { chain: 'lux', address: '0x9011E888251AB053B7bD1cdB598Db4f9DEd94714' },
    ])
  })

  /** An address is either an address or it is not shown. Half of one is a number to trust. */
  it('drops a row whose address is not one', () => {
    expect(
      wallets([
        { chain: 'lux', address: '0xnot-an-address' },
        { chain: 'lux', address: '0x9011E888' },
        { chain: 'lux' },
        null,
        { chain: 'lux', address: '0x9011E888251AB053B7bD1cdB598Db4f9DEd94714' },
      ]),
    ).toEqual([{ chain: 'lux', address: '0x9011E888251AB053B7bD1cdB598Db4f9DEd94714' }])
  })

  /** A chain nobody named is not guessed at. */
  it('leaves an unnamed chain unnamed', () => {
    expect(wallets([{ address: '0x9011E888251AB053B7bD1cdB598Db4f9DEd94714' }])).toEqual([
      { chain: null, address: '0x9011E888251AB053B7bD1cdB598Db4f9DEd94714' },
    ])
  })
})

describe('whether the connected wallet is the account’s', () => {
  const one = [{ chain: 'lux', address: '0x9011E888251AB053B7bD1cdB598Db4f9DEd94714' as const }]

  /** Checksummed and lowercase are the same key; only the rendering differs. */
  it('compares addresses without case', () => {
    expect(linked(one, '0x9011e888251ab053b7bd1cdb598db4f9ded94714')).toBe(true)
  })

  it('is false for an address the account does not record', () => {
    expect(linked(one, '0x0000000000000000000000000000000000000001')).toBe(false)
  })

  /**
   * Unknown is not linked. With no claim to compare against there is no ground
   * for saying the wallet in the room belongs to the account signed in.
   */
  it('is false when nothing is known and when nothing is connected', () => {
    expect(linked(null, '0x9011E888251AB053B7bD1cdB598Db4f9DEd94714')).toBe(false)
    expect(linked(one, null)).toBe(false)
    expect(linked(null, null)).toBe(false)
  })
})

describe('the did claim', () => {
  it('reads a DID', () => {
    expect(did('did:lux:z')).toBe('did:lux:z')
    expect(did('did:lux:mainnet:0x9011E888251AB053B7bD1cdB598Db4f9DEd94714')).toBe(
      'did:lux:mainnet:0x9011E888251AB053B7bD1cdB598Db4f9DEd94714',
    )
  })

  /**
   * Anything else is absent rather than passed on. The registry is asked with
   * this string verbatim, and a string that is not a DID comes back as a revert
   * that reads on screen as the chain's fault.
   */
  it('reports nothing for a value that is not one', () => {
    expect(did(undefined)).toBeNull()
    expect(did('')).toBeNull()
    expect(did('z@lux.network')).toBeNull()
    expect(did('did:lux:')).toBeNull()
    expect(did('lux:z')).toBeNull()
    expect(did(42)).toBeNull()
  })
})

/**
 * The page a reader returns to after signing in is read from storage, which
 * the page does not control. `history.replaceState` throws on a URL of another
 * origin, and it throws inside the callback — so a stored `//elsewhere` would
 * leave the reader on "completing sign-in" with a valid session in hand.
 */
describe('the page a sign-in returns to', () => {
  afterEach(() => vi.unstubAllGlobals())

  const back = (stored: string | null) => {
    let kept = stored
    vi.stubGlobal('localStorage', {
      getItem: () => kept,
      removeItem: () => {
        kept = null
      },
    })
    return was('https://pars.vote')
  }

  it('returns to the page the reader was on', () => {
    expect(back('/proposals/7?tab=votes#for')).toBe('/proposals/7?tab=votes#for')
    expect(back('/')).toBe('/')
  })

  it('returns home when nothing was kept', () => {
    expect(back(null)).toBe('/')
    expect(back('')).toBe('/')
  })

  it('returns home for anything that leaves this origin', () => {
    for (const away of ['//evil.example', '//evil.example/x', '/\\evil.example', '/\t/evil.example', 'https://evil.example/', 'javascript:alert(1)'])
      expect(back(away)).toBe('/')
  })

  it('forgets the page once it has been read', () => {
    let kept: string | null = '/treasury'
    vi.stubGlobal('localStorage', { getItem: () => kept, removeItem: () => { kept = null } })
    expect(was('https://pars.vote')).toBe('/treasury')
    expect(kept).toBeNull()
  })
})
