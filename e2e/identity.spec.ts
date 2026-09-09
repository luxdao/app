import { expect, test, type Page } from '@playwright/test'
import { ready } from './screens'

/**
 * Who a site says you are, measured on the site rather than in the source.
 *
 * The tenant is read from the hostname, so a test that only ever loads
 * 127.0.0.1 measures one of three answers and calls it three. Chromium resolves
 * every `*.localhost` name to loopback and Vite serves any host under it, so the
 * same server answers as all three sites and `brand()` reaches a different one
 * each time — `tenant()` reads every label, and `lux.vote.localhost` carries
 * `lux` in the first.
 *
 * NOTHING HERE LEAVES THE MACHINE. Every request to an issuer is answered by
 * `issuer()` below, so CI never asks lux.id for anything and a suite run offline
 * measures the same thing a suite run online does.
 */

interface Tenant {
  readonly host: string
  readonly issuer: string
  readonly client: string
  /**
   * The authorize host this tenant's discovery advertises. Zoo's really does
   * name another brand's, which is the reason the app pins it back.
   */
  readonly advertises: string
}

const TENANTS: readonly Tenant[] = [
  { host: 'lux.vote.localhost', issuer: 'lux.id', client: 'lux-vote', advertises: 'lux.id' },
  { host: 'zoo.vote.localhost', issuer: 'zoolabs.id', client: 'zoo-vote', advertises: 'hanzo.id' },
  { host: 'hanzo.vote.localhost', issuer: 'hanzo.id', client: 'hanzo-vote', advertises: 'hanzo.id' },
]

const base = new URL(process.env.BASE_URL || 'http://127.0.0.1:5288')

/** The same server, reached by a name that says which site it is. */
const site = (host: string, path = '/') => `${base.protocol}//${host}:${base.port}${path}`

/**
 * Every IAM in the estate, answered locally.
 *
 * Discovery is a cross-origin `fetch`, so the fulfilled response carries the
 * allow-origin header a browser demands — without it the SDK falls back to its
 * canonical paths and the test would pass while measuring the fallback rather
 * than the discovery it meant to.
 */
async function issuers(page: Page, advertise: Record<string, string> = {}) {
  for (const host of ['lux.id', 'zoolabs.id', 'hanzo.id']) {
    await page.route(`https://${host}/**`, (route) => {
      const url = new URL(route.request().url())
      if (url.pathname === '/.well-known/openid-configuration') {
        const at = advertise[host] ?? host
        return route.fulfill({
          headers: { 'access-control-allow-origin': '*' },
          json: {
            issuer: `https://${host}`,
            authorization_endpoint: `https://${at}/v1/iam/oauth/authorize`,
            token_endpoint: `https://${host}/v1/iam/oauth/token`,
            userinfo_endpoint: `https://${host}/v1/iam/oauth/userinfo`,
            jwks_uri: `https://${host}/v1/iam/.well-known/jwks`,
            response_types_supported: ['code'],
            grant_types_supported: ['authorization_code', 'refresh_token'],
          },
        })
      }
      return route.fulfill({
        contentType: 'text/html',
        body: `<title>${host}</title><h1>${host}</h1>`,
      })
    })
  }
}

test.describe('each site signs in at its own IAM', () => {
  for (const t of TENANTS) {
    test(`${t.host} offers a sign-in at ${t.issuer}`, async ({ page }) => {
      await issuers(page)
      await page.goto(site(t.host))
      await ready(page)

      // Where the credential is going, said before it is typed.
      await expect(page.getByRole('button', { name: `Sign in with ${t.issuer}` }).first()).toBeVisible()
    })

    test(`${t.host} still reads and still connects a wallet, signed out`, async ({ page }) => {
      await issuers(page)
      await page.goto(site(t.host))
      await ready(page)

      // Identity is IAM's; the wallet is a signer. Neither is a gate in front of
      // the page, and signing in is not a prerequisite for either.
      await expect(page.getByRole('button', { name: /^Sign in with / })).toBeVisible()
      await expect(page.getByRole('button', { name: /^Chain:/ })).toBeVisible()
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    })

    test(`${t.host} asks ${t.issuer} for a code as ${t.client}`, async ({ page }) => {
      // Zoo's discovery names hanzo.id as its authorize endpoint. Taken at its
      // word, a Zoo reader would be asked to "Sign in to Hanzo" under a Zoo
      // mark, which is a white-label violation and a credential handed to the
      // wrong login page. The host is pinned back to the tenant's own issuer.
      await issuers(page, { [t.issuer]: t.advertises })
      await page.goto(site(t.host))
      await ready(page)

      // One door, two ways in: connecting a wallet IS signing in, so the header
      // carries a single control and the issuer is a row inside it.
      await page.getByRole('button', { name: `Sign in with ${t.issuer}` }).first().click()
      await page.getByRole('button', { name: `Sign in with ${t.issuer}` }).last().click()
      await page.waitForURL(/oauth\/authorize/)

      const url = new URL(page.url())
      expect(url.host, 'the authorize page is the tenant’s own issuer').toBe(t.issuer)
      expect(url.searchParams.get('client_id')).toBe(t.client)
      expect(url.searchParams.get('redirect_uri')).toBe(site(t.host, '/auth/callback'))
      expect(url.searchParams.get('response_type')).toBe('code')
      // PKCE, because a browser cannot keep a secret. No client secret rides
      // here and none exists: these clients are registered `spa`.
      expect(url.searchParams.get('code_challenge_method')).toBe('S256')
      expect(url.searchParams.get('code_challenge')).toBeTruthy()
      expect(url.searchParams.get('client_secret')).toBeNull()
    })
  }
})

test('a sign-in that fails leaves the interface working', async ({ page }) => {
  await issuers(page)
  // The issuer returns to this path with no code and no state, which is what a
  // stale link or an interrupted round trip looks like. The exchange has to
  // fail, and it has to fail saying that nothing was read and nothing signed.
  await page.goto(site(TENANTS[0]!.host, '/auth/callback'))
  await expect(page.getByText(/Sign-in did not complete/i)).toBeVisible({ timeout: 30_000 })
  await expect(page.getByRole('link', { name: /Continue without signing in/i })).toBeVisible()
})

test('no screen claims a wallet belongs to an account nobody is signed in to', async ({ page }) => {
  await issuers(page)
  await page.goto(site(TENANTS[0]!.host))
  await ready(page)
  const body = await page.locator('body').innerText()
  expect(body).not.toMatch(/signed in as/i)
  expect(body).not.toMatch(/linked/i)
})
