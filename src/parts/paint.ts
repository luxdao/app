/**
 * What this interface is painted with.
 *
 * A text primitive given no colour resolves the engine's `$color`, which the
 * installed theme row publishes as near-black — on a black page, invisible. So
 * every readable string names its colour, and `plain` is the one the body of
 * the page is set in. These are custom properties rather than hex, so the whole
 * interface follows the token layer when it changes and a colour appears in
 * exactly one place.
 */
export const plain = 'var(--color-text-primary)'
export const quiet = 'var(--color-text-secondary)'
export const line = 'var(--color-border-divider)'
export const surface = 'var(--color-bg-primary)'
export const ground = 'var(--color-bg-body)'
export const link = 'var(--color-link-primary)'
export const good = 'var(--color-status-good)'
export const warn = 'var(--color-status-warn)'
export const bad = 'var(--color-status-bad)'

/** Focus, hoisted so every control that takes it draws the same ring. */
export const ring = {
  outlineColor: plain,
  outlineStyle: 'solid',
  outlineWidth: 2,
  outlineOffset: 2,
} as const

/** WCAG 2.2 target size (minimum), in CSS pixels. */
export const REACH = 24
/** A control in the header, and the height a tab draws at. */
export const CONTROL = 40
/** A row a thumb taps in a panel. */
export const ROW = 44
/** Where a line of prose stops being read at the published body size. */
export const MEASURE = 620
/** The page column. */
export const COLUMN = '72rem'
/** Page horizontal padding. */
export const INSET = 24
