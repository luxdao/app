import { readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { bootScript } from '@hanzo/appearance/state'
// The `.js` is deliberate. Vite's config loader wants an extension and
// TypeScript refuses a `.ts` one unless allowImportingTsExtensions is on;
// `.js` is what ESM asks a TypeScript source to be imported as.
import { boot } from './src/chrome/boot.js'
import { defineConfig, type Plugin } from 'vite'

/**
 * Every engine package, deduplicated.
 *
 * The design system draws through one module registry. Two physical copies of
 * any of these means two registries, and the symptom names nothing — a popover
 * throwing on an undefined reference, a theme that resolves on one component
 * and not its sibling. Read from disk rather than listed, so a package added by
 * an upgrade is deduplicated without anyone remembering to add it here.
 */
const engine = readdirSync(fileURLToPath(new URL('./node_modules/@hanzogui', import.meta.url)))
  .filter((d) => !d.startsWith('.'))
  .map((d) => `@hanzogui/${d}`)

/**
 * Puts the two settings that must precede first paint in <head>, ahead of the
 * bundle. A person's type scale and the ground the page is drawn on are a
 * custom property and a class on <html>; React mounts after first paint, so the
 * bundle cannot set either soon enough and the page would draw once at the
 * published reading and again at theirs.
 */
function head(): Plugin {
  return {
    name: 'head-settings',
    transformIndexHtml: () => [
      { tag: 'script', injectTo: 'head' as const, children: bootScript() },
      { tag: 'script', injectTo: 'head' as const, children: boot() },
    ],
  }
}

// The tenant this build falls back to, checked here rather than only in the app.
//
// brand.tsx throws on an unknown key, but that throw lands in a browser: the
// bundle builds, publishes, deploys, and shows a blank page. The keys are known
// at config time, so a typo should cost a failed build and not a failed site.
// Kept in step with BRANDS in src/chrome/brand.tsx.
const HOMES = ['lux', 'zoo', 'hanzo'] as const
const home = process.env.VITE_VOTE_HOME ?? 'lux'
if (!HOMES.includes(home as (typeof HOMES)[number])) {
  throw new Error(`VITE_VOTE_HOME names "${home}", which is not a tenant. Known: ${HOMES.join(', ')}.`)
}

export default defineConfig(({ mode }) => ({
  plugins: [react(), head()],
  define: {
    __DEV__: mode !== 'production',
    'process.env.NODE_ENV': JSON.stringify(mode === 'production' ? 'production' : 'development'),
    // The design system ships analytics that post to api.hanzo.ai on load, on
    // by default. This is a governance interface: who reads a proposal, and
    // when, is exactly the kind of thing it has no business reporting. `off` is
    // the switch @hanzogui/telemetry already publishes, set here rather than in
    // a .env so the decision is visible in the build and cannot be lost by a
    // missing file.
    'import.meta.env.VITE_HANZO_TELEMETRY': JSON.stringify('off'),
  },
  resolve: {
    // The engine is cross-platform and reaches for react-native at module
    // scope. In a browser bundle that has to land on the web build.
    alias: { 'react-native': 'react-native-web' },
    dedupe: ['react', 'react-dom', 'react-native-web', '@hanzo/gui', ...engine],
  },
  // The engine and its web shim reach React through CommonJS. Split into their
  // own chunk they resolve a different copy and `createContext` is undefined at
  // first paint.
  build: { commonjsOptions: { include: [/node_modules/] } },
  optimizeDeps: {
    include: ['react-native-web', '@react-native/normalize-color', '@hanzo/gui', '@hanzogui/core'],
  },
  server: {
    port: 5288,
    // If the port is taken, stop rather than move. A dev server that quietly
    // picks another port is how two builds end up served at once and the one
    // being read is not the one being edited.
    strictPort: true,
  },
}))
