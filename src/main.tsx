import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import { GuiProvider } from '@hanzo/gui'
import { IamProvider } from '@hanzo/iam/react'
import { gui } from './chrome/gui'
import App from './App'
import { Returning } from './chrome/account'
import { add, brand } from './chrome/brand'
import * as id from './chrome/id'
import * as theme from './chrome/theme'
import { TENANTS } from './tenants'
// The type ramp the design system multiplies. `@hanzo/design` publishes
// `--text-*` as a calc against `--type-scale`; without it every size falls back
// to a frozen literal and the scale stops being adjustable.
// Zen, the house face — the faces first, then the weight presets that name the
// voices, so a weight is chosen by what it is for rather than by a number.
import '@hanzo/font/css'
import '@hanzo/font/presets.css'
import '@hanzo/design/styles.css'
// Skeleton draws its fill and corner from tokens; its pulse is a keyframe that
// lives here. Without this line every pending read is a static grey box — the
// shape of a loading state with none of the signal.
import '@hanzo/ui/styles/motion.css'
import './ground.css'

/**
 * The sites this build serves, registered before anything reads which one it
 * is. Here and only here: the screens and the chrome name no tenant, which is
 * what keeps these three out of a bundle built by a fork.
 */
add(...TENANTS)

/**
 * The tenant's IAM, read once.
 *
 * Outside the component because the SDK instance is keyed on this object's
 * fields: rebuilding it on a render would rebuild the engine and drop the
 * session with it. It is also the first read of the tenant, so it comes after
 * the registration above.
 */
const iam = id.config()

/**
 * Auth is IAM's, and only IAM's.
 *
 * `IamProvider` is the whole of it: the credential is collected at the issuer's
 * origin, PKCE binds the code to this browser, and this bundle holds a token it
 * did not mint. There is no password here, no one-time code, no session of our
 * own, and nothing in this repository that could be reviewed as authentication.
 *
 * It wraps the router rather than a route, because who is reading is a fact
 * about the document and not about the screen, and because the callback is
 * answered above the router by `Returning` — a redirect step is not a place.
 */
function Surface() {
  const t = theme.use()
  useEffect(() => theme.apply(t), [t])
  return (
    <GuiProvider config={gui} defaultTheme={t}>
      <IamProvider config={iam}>
        <Returning>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </Returning>
      </IamProvider>
    </GuiProvider>
  )
}

// Which site this is. index.html carries "Vote" alone because it is served on
// every host; the tenant is a fact about the host and is added here.
/**
 * What the browser's own chrome shows: the tenant's name and the tenant's mark.
 *
 * Here rather than in index.html because one bundle serves three hosts, and the
 * document is the same file on all of them. A mark written into the head would
 * be Lux's triangle in Zoo's tab for as long as it took the bundle to parse —
 * and would stay there on any host whose tenant this build did not guess.
 */
function head(): void {
  const it = brand()
  document.title = `${it.name} Vote`
  for (const [rel, href, type] of [
    ['icon', it.icon.svg, 'image/svg+xml'],
    ['apple-touch-icon', it.icon.touch, undefined],
  ] as const) {
    const link = document.querySelector(`link[rel="${rel}"]`) ?? document.head.appendChild(Object.assign(document.createElement('link'), { rel }))
    link.setAttribute('href', href)
    if (type) link.setAttribute('type', type)
  }
}

head()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Surface />
  </StrictMode>,
)
