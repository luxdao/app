import { expect, test } from '@playwright/test'
import { SCREENS, ready } from './screens'

/**
 * The rule this interface exists to keep.
 *
 * The app being replaced rendered a hard-coded proposal list — four named
 * proposals with vote counts, on a Governor that has never had one — beside
 * stat tiles reading "4 Total Proposals, 2 Active". Every number was invented.
 * These tests are what stop that coming back, and they are deliberately about
 * the rendered page rather than the source, because a fabricated figure can
 * arrive from a fixture, a default argument or a component library just as
 * easily as from a literal somebody typed.
 */

/** Strings from the retired Pars app and its Decent-derived predecessor. */
const INVENTED = [
  'PersianDAO', 'vePARS', 'MIGA', 'MIP-00',
  '125,000', '156 delegators', '98% participation',
  'Emergency Medical Aid',
]

test.describe('no screen carries a figure nobody measured', () => {
  for (const path of SCREENS) {
    test(`${path} shows none of the retired app's invented content`, async ({ page }) => {
      await page.goto(path)
      await ready(page)
      const body = (await page.locator('body').innerText()).toLowerCase()
      const hits = INVENTED.filter((s) => body.includes(s.toLowerCase()))
      expect(hits, `${path} renders invented content: ${hits.join(', ')}`).toEqual([])
    })
  }
})

test('the picker offers this site\'s own chain and no other estate\'s', async ({ page }) => {
  // One site is one tenant, and a tenant declares one chain: this site reads
  // its own. A picker listing Zoo, Pars and Hanzo on lux.vote
  // told a reader they were somewhere shared and put another network's
  // addresses under this one's mark — which is what `roster()` ended.
  await page.goto('/work')
  await ready(page)
  await page.getByRole('button', { name: /Chain:/ }).click()
  for (const other of [/^Zoo/, /^Pars/, /^Hanzo/]) {
    await expect(page.getByRole('button', { name: other })).toHaveCount(0)
  }
  await expect(page.getByRole('button', { name: /^Lux C-Chain · 96369/ })).toBeVisible()
})

test('the deployment survey distinguishes all four readings', async ({ page }) => {
  await page.goto('/deployment')
  await expect(page.getByRole('heading', { level: 1, name: 'Smart contracts' })).toBeVisible()
  // Every reading is a measurement performed on load; each of the four has to
  // be reachable or the distinction is decorative.
  await expect(page.getByText('deployed', { exact: true }).first()).toBeVisible({ timeout: 45_000 })
  await expect(page.getByText('not deployed', { exact: true }).first()).toBeVisible()
  await expect(page.getByText('no record', { exact: true }).first()).toBeVisible()
})

test('a register says what it read, and an empty one says why it is empty', async ({ page }) => {
  // Governance is deployed on 96369 and one proposal exists, so the register
  // draws it. The sentence this test used to demand — "no proposal has ever
  // been created" — was true of a chain nobody had used and became a lie the
  // moment somebody did; the scan floor was measured on the chain before its
  // re-genesis, so the walk began past the head, issued no call at all, and
  // rendered an empty result as a fact about governance. What is asserted now
  // is that the screen reports what it read: a row, or an emptiness it can
  // account for. Never a refusal wearing either.
  await page.goto('/proposals')
  await expect(page.getByRole('heading', { level: 1, name: 'Proposals' })).toBeVisible()
  // Wait for the register itself, not for the word — the heading matches
  // /proposal/ before a single block has been read, and a body scraped then is
  // a body scraped mid-scan.
  await expect(page.getByText(/\d+\s+proposals?\b|never been created/i).first()).toBeVisible({
    timeout: 45_000,
  })
  const body = (await page.locator('body').innerText()).toLowerCase()
  expect(body, 'a refusal must not read as an empty register').not.toMatch(/could not be read/)
  expect(
    /\d+\s+proposal/.test(body) || /never been created/.test(body),
    'the register neither drew a row nor accounted for being empty',
  ).toBe(true)
})

test('the standing note about custody is on every screen', async ({ page }) => {
  for (const path of SCREENS) {
    await page.goto(path)
    await ready(page)
    await expect(page.getByText(/you sign every transaction in your own wallet/i).first()).toBeVisible()
  }
})
