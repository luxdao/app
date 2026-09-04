import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import { GuiProvider } from '@hanzo/gui'
import { gui } from './chrome/gui'
import App from './App'
import { BRAND } from './chrome/brand'
import * as theme from './chrome/theme'
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

function Surface() {
  const t = theme.use()
  useEffect(() => theme.apply(t), [t])
  return (
    <GuiProvider config={gui} defaultTheme={t}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </GuiProvider>
  )
}

// Which site this is. index.html carries "Vote" alone because it is served on
// every host; the tenant is a fact about the host and is added here.
document.title = `${BRAND.name} Vote`

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Surface />
  </StrictMode>,
)
