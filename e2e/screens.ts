/**
 * Every screen this interface serves.
 *
 * One list, imported by each suite, so a screen added without being measured is
 * not possible — the suites cannot drift apart because there is only one.
 */
export const SCREENS = [
  '/',
  '/proposals',
  '/proposals/new',
  // A proposal id that is not on the register. The screen has to say so rather
  // than throw, and it is the only route here that reads a path parameter.
  '/proposals/0',
  '/delegate',
  '/stake',
  '/treasury',
  '/work',
  '/roles',
  '/karma',
  '/gauges',
  // The survey reaches four chains rather than one, so it is the slowest screen
  // and the one most likely to be measured mid-read.
  '/deployment',
  '/settings',
  // A link nobody wrote, which still has to name itself.
  '/nothing-here',
] as const

/**
 * Wait until the screen itself is on the page.
 *
 * Every route is lazy, so `#root` has children — the shell, the nav, a
 * "Loading…" fallback — a beat before the screen mounts. A check that runs at
 * that moment measures the fallback and passes, which is how a suite comes to
 * cover the shell thirteen times and no screen at all. Found by a negative
 * control: a utility class deliberately added to a route did not fail the
 * class check, because the route had not rendered when the check ran.
 *
 * The level-one heading is the marker because only a screen draws one.
 */
export async function ready(page: import('@playwright/test').Page) {
  await page.locator('#root > *').first().waitFor({ state: 'visible' })
  await page.locator('h1').first().waitFor({ state: 'visible', timeout: 45_000 })
}
