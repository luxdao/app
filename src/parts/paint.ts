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
/**
 * The third ink rung: a figure nobody entered, a control nobody can press, a
 * sentence standing under a card. Named because it had no name, and everything
 * that wanted it was drawn at `quiet` instead.
 */
export const faint = 'var(--color-text-faint)'

/**
 * A sheet: a card made opaque, for a panel that opens over the page. A card is
 * the page's own ground inside a hairline, which is right until something has
 * to stop the page being read through it.
 */
export const sheet = 'var(--color-bg-body)'

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
/**
 * A card's corner, said once.
 *
 * Two shapes were drawing the same role: a Panel rounded at `$8` (22px) and the
 * Answer boxes at `$6` (16px), side by side on the same screen. Nothing chose
 * between them -- each was written where it was needed. One name, so the next
 * card cannot pick a third.
 */
export const CORNER = '$6'

/** The page column. */
export const COLUMN = '72rem'
/** Page horizontal padding. */
export const INSET = 24
