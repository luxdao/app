import { chromium } from '@playwright/test'
const [url, out, w, h, wait] = process.argv.slice(2)
const b = await chromium.launch()
const p = await b.newPage({ viewport: { width: +w || 1280, height: +(h || 900) }, deviceScaleFactor: 1 })
p.on('console', (m) => { if (m.type() === 'error') console.log('CONSOLE ERROR:', m.text().slice(0, 400)) })
p.on('pageerror', (e) => console.log('PAGE ERROR:', String(e).slice(0, 400)))
await p.goto(url, { waitUntil: 'networkidle', timeout: 60000 }).catch((e) => console.log('nav:', e.message))
await p.waitForTimeout(+(wait || 2500))
await p.screenshot({ path: out, fullPage: true })
// An empty document reports equal widths and passes every layout check, so the
// child count is printed beside the measurement rather than trusted from it.
const kids = await p.evaluate(() => document.getElementById('root')?.children.length ?? -1)
const ow = await p.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth])
const styled = await p.evaluate(() => {
  const h1 = document.querySelector('h1')
  if (!h1) return 'no h1'
  const s = getComputedStyle(h1)
  return `h1 font=${s.fontFamily.split(',')[0]} size=${s.fontSize} color=${s.color}`
})
const bg = await p.evaluate(() => getComputedStyle(document.body).backgroundColor)
console.log('root children', kids, 'scroll/client', ow.join('/'), '|', styled, '| body bg', bg)
await b.close()
