import { Grid, tracks } from '@hanzo/ui/grid'
import { YStack } from '@hanzogui/stacks'
import { SizableText } from '@hanzogui/text'
import type { ReactNode } from 'react'
import { plain, quiet } from './paint'

/**
 * A fact either has a value or says why it has none. The union makes the third
 * case — a term rendered beside an empty string — unspellable.
 */
export type Fact = { term: string } & (
  | { value: NonNullable<ReactNode>; unread?: undefined }
  | { value?: undefined; unread: string }
)

export const fact = (term: string, value: ReactNode | null | undefined, unread = 'not read'): Fact =>
  value === null || value === undefined || value === ''
    ? { term, unread }
    : { term, value: value as NonNullable<ReactNode> }

/**
 * The gutter, in pixels rather than a token, because `tracks` has to be given
 * the same gap the grid is drawn with. A track list computed against a gutter
 * of zero and then drawn with a real one asks for more columns than fit, and
 * auto-fill quietly hands back one.
 */
const gutter = 16

export function Facts({ rows, min = 240, max = 3 }: { rows: Fact[]; min?: number; max?: number }) {
  return (
    <YStack
      render="dl"
      display="grid"
      gridTemplateColumns={tracks({ min, max }, gutter)}
      alignItems="flex-start"
      gap={gutter}
      margin={0}
    >
      {rows.map((r) => (
        <YStack key={r.term} gap="$1" minWidth={0}>
          <SizableText render="dt" size="$2" color={quiet}>
            {r.term}
          </SizableText>
          <SizableText
            render="dd"
            display="block"
            margin={0}
            size="$4"
            color={r.unread ? quiet : plain}
            fontFamily={r.unread ? undefined : '$mono'}
            wordWrap="break-word"
          >
            {r.unread ?? r.value}
          </SizableText>
        </YStack>
      ))}
    </YStack>
  )
}

export { Grid }
