import { Card, CardHeader } from '@hanzogui/card'
import { YStack } from '@hanzogui/stacks'
import { Heading, Paragraph } from '@hanzogui/text'
import { useId, type ReactNode } from 'react'
import { line, plain, quiet, surface } from './paint'

/** A titled section. The heading is bound to the section it names. */
export function Panel({
  title,
  note,
  children,
  level = 'h2',
}: {
  title: string
  note?: ReactNode
  children: ReactNode
  level?: 'h2' | 'h3'
}) {
  const named = useId()
  return (
    <Card
      render="section"
      aria-labelledby={named}
      gap="$3"
      padding="$4"
      borderRadius="$8"
      borderWidth={1}
      borderColor={line}
      backgroundColor={surface}
      minWidth={0}
    >
      <CardHeader unstyled padding={0} gap="$2">
        <Heading render={level} id={named} size="$5" margin={0} color={plain}>
          {title}
        </Heading>
        {note ? (
          <Paragraph size="$3" margin={0} color={quiet}>
            {note}
          </Paragraph>
        ) : null}
      </CardHeader>
      {children}
    </Card>
  )
}

/** The standard screen opening: one h1, one sentence under it. */
export function Title({ children, lede }: { children: ReactNode; lede?: ReactNode }) {
  return (
    <YStack render="header" gap="$2" minWidth={0}>
      <Heading render="h1" size="$8" margin={0} color={plain}>
        {children}
      </Heading>
      {lede ? (
        <Paragraph size="$4" margin={0} color={quiet} maxWidth={620}>
          {lede}
        </Paragraph>
      ) : null}
    </YStack>
  )
}
