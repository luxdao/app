import { SizableText } from '@hanzogui/text'
import type { ReactNode } from 'react'
import { bad, good, line, plain, quiet, warn } from './paint'

export type Tone = 'plain' | 'good' | 'warn' | 'bad'

const ink: Record<Tone, string> = { plain: quiet, good, warn, bad }

/** An outlined badge. Colour is never the only carrier — the word is the signal. */
export function Mark({ children, tone = 'plain' }: { children: ReactNode; tone?: Tone }) {
  return (
    <SizableText
      display="inline-flex"
      alignItems="center"
      minHeight={24}
      paddingHorizontal="$2"
      borderRadius="$12"
      borderWidth={1}
      borderColor={tone === 'plain' ? line : ink[tone]}
      size="$2"
      color={tone === 'plain' ? plain : ink[tone]}
      whiteSpace="nowrap"
    >
      {children}
    </SizableText>
  )
}
