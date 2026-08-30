import { expect, test } from '@playwright/test'
import { SCREENS, ready } from './screens'

/**
 * What the rendered page proves that a grep cannot.
 *
 * A grep over source says what this repository wrote. It says nothing about
 * what a component library put on the page underneath — and the whole claim
 * here is about the page: that it is drawn by the design system's engine
 * through style props, and not by a stylesheet of utility classes. This build
 * ships no utility framework at all, so a hit is either a dependency bringing
 * one in or somebody adding one back.
 */

/**
 * Names the engine and the design system own are not utilities and never count:
 * the engine stamps `is_Text`, `_display-flex` and similar style hashes on
 * everything it draws.
 */
const OURS = /^(is_|_|t_|hz-|lux-|font_|dark$|light$)/

/**
 * Shape-based rather than a dictionary, because the vocabulary is hundreds of
 * tokens deep and a list of them rots. A utility is a lowercase word carrying a
 * `-`, `:` or `[` — `items-center`, `hover:bg-transparent`, `text-[10px]`.
 *
 * The second alternative is for the one-word utilities that shape alone cannot
 * catch. `flex` and `block` carry no separator and would otherwise pass, which a
 * negative control found: a deliberately injected `class="flex items-center"`
 * was reported with two of its three names.
 */
const UTIL = '^-?[a-z][a-z0-9]*(?:[-:/][a-z0-9[\\]().,%#_-]*)+$|^[a-z-]+\\[' +
  '|^(flex|grid|block|inline|hidden|absolute|relative|fixed|sticky|static|container|truncate|italic|underline|uppercase|lowercase|capitalize|invisible|visible)$'

test.describe('the page is drawn by the engine, not by a stylesheet', () => {
  for (const path of SCREENS) {
    test(`${path} carries no utility classes`, async ({ page }) => {
      await page.goto(path)
      await ready(page)

      const found = await page.evaluate(
        (src) => {
          const re = new RegExp(src.ours)
          const util = new RegExp(src.util)
          const out: string[] = []
          for (const el of Array.from(document.querySelectorAll<HTMLElement>('[class]'))) {
            const cls = typeof el.className === 'string' ? el.className : ''
            const hits = cls
              .trim()
              .split(/\s+/)
              .filter(Boolean)
              .filter((t) => !re.test(t))
              .filter((t) => util.test(t))
            if (hits.length) out.push(`${el.tagName.toLowerCase()}: ${hits.slice(0, 6).join(' ')}`)
          }
          return out.slice(0, 12)
        },
        { ours: OURS.source, util: UTIL },
      )

      expect(found, `${path} renders utility classes: ${found.join(' | ')}`).toEqual([])
    })
  }
})

test('no stylesheet in the document declares a utility class', async ({ page }) => {
  await page.goto('/')
  await ready(page)
  // Reads the rules the browser actually parsed, so a framework arriving inside
  // a dependency's CSS is caught as well as one imported here.
  const suspects = await page.evaluate(() => {
    const out: string[] = []
    for (const sheet of Array.from(document.styleSheets)) {
      let rules: CSSRuleList
      try {
        rules = sheet.cssRules
      } catch {
        continue
      }
      for (const rule of Array.from(rules)) {
        const text = (rule as CSSStyleRule).selectorText
        if (!text) continue
        if (/\.(flex|grid|hidden|block|items-|justify-|text-|bg-|p[xytblr]?-\d|m[xytblr]?-\d|w-\d|h-\d)/.test(text)) {
          out.push(text.slice(0, 80))
        }
      }
    }
    return out.slice(0, 10)
  })
  expect(suspects, `a stylesheet declares utility classes: ${suspects.join(' | ')}`).toEqual([])
})

test.describe('every screen says what it is', () => {
  for (const path of SCREENS) {
    test(`${path} renders and names itself`, async ({ page }) => {
      const broke: string[] = []
      page.on('pageerror', (e) => broke.push(String(e)))

      await page.goto(path)

      // A screen that threw while rendering can still show a heading, because
      // React keeps what it committed before the throw. The console is where
      // that shows.
      const mounted = await page.locator('#root > *').count()
      expect(mounted, `${path} mounted nothing`).toBeGreaterThan(0)

      const h1 = page.getByRole('heading', { level: 1 })
      await expect(h1, `${path} has no level-one heading, so nothing says what the screen is`).toBeVisible()
      expect(await h1.count(), `${path} has more than one level-one heading`).toBe(1)

      expect(broke, `${path} threw while rendering`).toEqual([])
    })
  }
})

test.describe('everything reachable has a name', () => {
  for (const path of SCREENS) {
    test(`${path} names every control`, async ({ page }) => {
      await page.goto(path)
      await ready(page)

      // A control with no accessible name is unreadable to a screen reader, and
      // on these screens the controls carry addresses and vote counts.
      const unnamed = await page.evaluate(() => {
        const sel = 'a[href], button, input, select, textarea, [role="button"], [role="link"]'
        const out: string[] = []
        for (const el of Array.from(document.querySelectorAll<HTMLElement>(sel))) {
          const s = getComputedStyle(el)
          if (s.display === 'none' || s.visibility === 'hidden') continue
          if ((el as HTMLInputElement).type === 'hidden') continue
          const named =
            (el.textContent || '').trim() ||
            el.getAttribute('aria-label') ||
            el.getAttribute('title') ||
            (el.getAttribute('id') && document.querySelector(`label[for="${el.getAttribute('id')}"]`)) ||
            el.closest('label')
          if (!named) out.push(`${el.tagName.toLowerCase()}${el.getAttribute('type') ? `[${el.getAttribute('type')}]` : ''}`)
        }
        return out.slice(0, 8)
      })

      expect(unnamed, `${path} has unnamed controls: ${unnamed.join(', ')}`).toEqual([])
    })
  }
})
