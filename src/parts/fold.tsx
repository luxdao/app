import { YStack } from '@hanzogui/stacks'
import { SizableText } from '@hanzogui/text'
import type { ReactNode } from 'react'
import { line, plain, quiet } from './paint'

/**
 * Something a screen holds and does not show.
 *
 * A `<details>` and not a state of our own: the browser gives it the disclosure
 * keyboard behaviour, the open state survives a re-render without anything
 * storing it, and a reader who wants the contents can find them with a search
 * before opening it.
 *
 * It exists because two readers arrive at a failed read. One wants to know it
 * failed; the other is fixing it and wants the request. Printing the second
 * reader's answer on the screen makes the first read a stack trace.
 */
export function Fold({ say, children }: { say: string; children: ReactNode }) {
  return (
    <YStack render="details" gap="$2">
      <SizableText
        render="summary"
        size="$2"
        color={quiet}
        cursor="pointer"
        hoverStyle={{ color: plain }}
        style={{ listStyle: 'none' }}
      >
        {say}
      </SizableText>
      <YStack paddingTop="$2" borderTopWidth={1} borderTopColor={line}>
        {children}
      </YStack>
    </YStack>
  )
}
