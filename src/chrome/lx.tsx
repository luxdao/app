/**
 * The LX mark, drawn rather than fetched.
 *
 * Inline because a logo in the header is not an image the page waits for: an
 * <img> renders after a round trip and moves the row it sits in when it lands,
 * which is a layout shift on the first thing a person looks at.
 *
 * Drawn in `currentColor` rather than in the brand's own two colours. The
 * published file paints itself with a `prefers-color-scheme` rule, so it
 * follows the desktop — the wrong authority inside an app that carries its own
 * setting. Somebody reading this in light on a dark machine would get a white
 * mark on a white header. Inheriting the colour puts the mark under the same
 * token layer as the text beside it, which is what @hanzo/appearance moves.
 * The copies in public/ keep that rule, because a browser tab and a home
 * screen genuinely do belong to the desktop.
 *
 * The geometry is the published mark's, at its own 43x17 viewBox, with the X
 * carried through the translate the file draws it inside.
 */

/**
 * How tall the mark stands, and the aspect that follows from the viewBox.
 *
 * Twenty, so the mark reads as the brand at the leading edge rather than as an
 * icon in front of a word. The letterforms are all caps and the viewBox is
 * their cap height exactly, so a mark set to the type size beside it comes out
 * visibly smaller than the word — cap height is around seven tenths of a face's
 * size, and matching the numbers is what makes a lockup look shrunk.
 */
const HEIGHT = 20

/**
 * How wide the mark comes out at the header's height.
 *
 * Exported because the products panel hangs off the leading edge of the whole
 * lockup rather than off the caret that opens it, and the difference between
 * the two is this width and the gap between them. A second copy of the ratio
 * in that file would be a second answer to how wide the mark is.
 */
export const WIDTH = Math.round((HEIGHT * 43) / 17)

/**
 * The mark, at the header's height unless a caller says otherwise.
 *
 * The landing page wants it larger — a door states the brand where a header
 * only labels it — and a ratio is the whole of what changes, so the width
 * follows the height rather than being a second thing to keep in step.
 */
export function LX({ height = HEIGHT }: { height?: number } = {}) {
  return (
    <svg
      viewBox="0 0 43 17"
      height={height}
      width={(height * 43) / 17}
      fill="currentColor"
      fillRule="nonzero"
      role="img"
      aria-label="Lux"
    >
      <polygon points="18 12.485 18 17 0 17 0 0 5.061 0 5.061 12.485" />
      <path d="M18.7,0 L25.64,0 L30.841,5.265 L36.069,0 L42.991,0 L34.478,8.374 L43,16.748 L36.078,16.748 L30.85,11.483 L25.649,16.748 L18.7,16.748 L27.25,8.374 Z" />
    </svg>
  )
}
