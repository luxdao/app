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

test('an absent contract is reported as absent, never as an empty list', async ({ page }) => {
  // Pars carries a work-market address on record and has no code at it. The
  // board must say the market is not deployed rather than draw an empty table,
  // which would read as a market with no tasks yet.
  await page.goto('/work')
  await ready(page)
  await page.getByRole('button', { name: /Chain:/ }).click()
  await page.getByRole('button', { name: /^Pars/ }).click()
  await expect(page.getByText(/is not deployed on this chain/i).first()).toBeVisible({ timeout: 30_000 })
})

test('the deployment survey distinguishes all four readings', async ({ page }) => {
  await page.goto('/deployment')
  await expect(page.getByRole('heading', { level: 1, name: 'What is deployed' })).toBeVisible()
  // Every reading is a measurement performed on load; each of the four has to
  // be reachable or the distinction is decorative.
  await expect(page.getByText('deployed', { exact: true }).first()).toBeVisible({ timeout: 45_000 })
  await expect(page.getByText('not deployed', { exact: true }).first()).toBeVisible()
  await expect(page.getByText('no record', { exact: true }).first()).toBeVisible()
})

test('an empty register says nothing was created, not that nothing loaded', async ({ page }) => {
  await page.goto('/proposals')
  await expect(page.getByRole('heading', { level: 1, name: 'Proposals' })).toBeVisible()
  await expect(page.getByText(/No proposal has ever been created/i)).toBeVisible({ timeout: 45_000 })
})

test('the standing note about custody is on every screen', async ({ page }) => {
  for (const path of SCREENS) {
    await page.goto(path)
    await ready(page)
    await expect(page.getByText(/you sign every transaction in your own wallet/i).first()).toBeVisible()
  }
})
