import { SizableText } from '@hanzogui/text'
import { Link } from './link'
import { plain } from './paint'

/** Ten leading, eight trailing — enough to compare two by eye without wrapping. */
export const short = (a: string): string =>
  a.length > 20 ? `${a.slice(0, 10)}…${a.slice(-8)}` : a

/**
 * An address, linked to the explorer when the chain has one.
 *
 * The full value is in the `title`, so it is recoverable without a round trip
 * to a block explorer — a shortened address that cannot be read in full is a
 * number the reader is asked to trust.
 */
export function Address({
  at,
  explorer,
  full = false,
}: {
  at: string
  explorer?: string | null
  full?: boolean
}) {
  const text = full ? at : short(at)
  if (!explorer) {
    return (
      <SizableText
        render={<span title={at} />}
        size="$2"
        color={plain}
        fontFamily="$mono"
        wordWrap="break-word"
      >
        {text}
      </SizableText>
    )
  }
  return (
    <Link href={`${explorer}/address/${at}`} size="$2">
      {text}
    </Link>
  )
}
