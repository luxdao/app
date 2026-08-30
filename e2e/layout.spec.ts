import { expect, test } from '@playwright/test'
import { SCREENS, ready } from './screens'

/**
 * The same screens at the widths people actually hold.
 *
 * A layout failure does not throw. The page mounts, the heading is visible,
 * every other suite passes, and a table has quietly pushed the document two
 * hundred pixels wider than the phone rendering it — so the reader scrolls
 * sideways to find the rest of a vote count, or never learns it was there.
 */

const WIDTHS = [
  { name: 'phone', width: 390, height: 844 },
  { name: 'phone-large', width: 430, height: 932 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'laptop', width: 1280, height: 800 },
  { name: 'desktop', width: 1920, height: 1080 },
] as const

/**
 * Wait until the geometry stops moving.
 *
 * A measurement taken the instant a route mounts is a measurement of a page
 * mid-layout: a webfont has not landed, so every string is still sized in the
 * fallback face and the widths are somebody else's. That reports overflow on a
 * page that ends up fitting — a false finding, and the expensive kind, because
 * it sends someone to read CSS that was never wrong.
 */
async function settled(page: import('@playwright/test').Page) {
  await page.evaluate(() => document.fonts.ready)
  await page.evaluate(
    () =>
      new Promise<void>((done) => {
        let last = -1
        let same = 0
        const tick = () => {
          const w = document.documentElement.scrollWidth
          same = w === last ? same + 1 : 0
          last = w
          if (same >= 2) done()
          else requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
      }),
  )
}

/** Elements crossing the viewport edge, each named by the shortest thing that identifies it. */
async function culprits(page: import('@playwright/test').Page, width: number) {
  return page.evaluate((w) => {
    const over: { name: string; right: number; left: number }[] = []
    for (const el of Array.from(document.body.querySelectorAll<HTMLElement>('*'))) {
      const s = getComputedStyle(el)
      if (s.display === 'none' || s.visibility === 'hidden') continue
      const r = el.getBoundingClientRect()
      if (r.width === 0 || r.height === 0) continue
      if (r.right <= w + 1 && r.left >= -1) continue

      let skip = false
      for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
        const pr = p.getBoundingClientRect()
        // A wide child inside a wide parent names the parent twice and the
        // child not at all. Report the outermost box that crosses.
        if (pr.right > w + 1 || pr.left < -1) {
          skip = true
          break
        }
        // A scroll container is meant to hold something wider than itself —
        // that is what it is for, and its content is reachable. Only the
        // container's own box has to fit, and it does or it would have
        // offended above.
        if (/(auto|scroll|hidden)/.test(getComputedStyle(p).overflowX)) {
          skip = true
          break
        }
      }
      if (skip) continue

      const id = el.id ? `#${el.id}` : ''
      over.push({ name: `${el.tagName.toLowerCase()}${id}`, right: Math.round(r.right), left: Math.round(r.left) })
    }
    return over
  }, width)
}

for (const vp of WIDTHS) {
  test.describe(`${vp.name} — ${vp.width}x${vp.height}`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } })

    for (const path of SCREENS) {
      test(`${path} fits and renders`, async ({ page }) => {
        const broke: string[] = []
        page.on('pageerror', (e) => broke.push(String(e)))

        await page.goto(path)

        // An empty document reports scrollWidth === clientWidth and raises no
        // layout complaint, so every width check below would pass on a page
        // that rendered nothing. Establish there is something first.
        const mounted = await page.locator('#root > *').count()
        expect(mounted, `${path} mounted nothing at ${vp.width}px`).toBeGreaterThan(0)

        await ready(page)
        await settled(page)

        const over = await culprits(page, vp.width)
        expect(
          over,
          `${path} at ${vp.width}px is crossed by: ${over.map((o) => `${o.name} [${o.left}..${o.right}]`).join(', ')}`,
        ).toEqual([])

        const scrolls = await page.evaluate(
          () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
        )
        expect(scrolls, `${path} at ${vp.width}px scrolls sideways`).toBe(false)

        expect(broke, `${path} threw at ${vp.width}px`).toEqual([])
      })
    }
  })
}

test.describe('phone — what a thumb can hit', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  for (const path of SCREENS) {
    test(`${path} has no target too small to press`, async ({ page }) => {
      await page.goto(path)
      await ready(page)
      await settled(page)

      // WCAG 2.2 target size (minimum) is 24 by 24 CSS pixels. Anything the
      // page offers to a finger and then renders smaller than that is a control
      // most people cannot reliably hit.
      const small = await page.evaluate(() => {
        const out: string[] = []
        const sel =
          'a[href], button, input, select, textarea, [role="button"], [role="link"], [role="tab"]'
        for (const el of Array.from(document.querySelectorAll<HTMLElement>(sel))) {
          const s = getComputedStyle(el)
          if (s.display === 'none' || s.visibility === 'hidden') continue
          if ((el as HTMLInputElement).type === 'hidden') continue
          const r = el.getBoundingClientRect()
          if (r.width === 0 || r.height === 0) continue
          if (r.width < 24 || r.height < 24) {
            const label = (el.textContent || '').trim().slice(0, 24) || el.tagName.toLowerCase()
            out.push(`${label} (${Math.round(r.width)}x${Math.round(r.height)})`)
          }
        }
        return out
      })

      expect(small, `${path} has targets under 24px: ${small.join(', ')}`).toEqual([])
    })
  }
})
