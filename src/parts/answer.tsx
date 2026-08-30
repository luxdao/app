import { YStack } from '@hanzogui/stacks'
import { Paragraph, SizableText } from '@hanzogui/text'
import type { ReactNode } from 'react'
import type { Read } from '../gov/read'
import { bad, line, plain, quiet, surface } from './paint'

/**
 * What a screen says when it has no rows to draw.
 *
 * The four outcomes are four different sentences and this is the component that
 * keeps them apart. "There is no contract at this address" and "this contract
 * has nothing yet" are the two most often collapsed into one another, and the
 * collapse always favours the reassuring reading: an empty list looks like a
 * young DAO rather than an absent one.
 */
export function Answer({ title, detail }: { title: string; detail?: ReactNode }) {
  return (
    <YStack
      gap="$2"
      padding="$4"
      borderRadius="$6"
      borderWidth={1}
      borderColor={line}
      backgroundColor={surface}
    >
      <SizableText size="$4" color={plain}>
        {title}
      </SizableText>
      {detail ? (
        <Paragraph size="$3" margin={0} color={quiet}>
          {detail}
        </Paragraph>
      ) : null}
    </YStack>
  )
}

/**
 * Renders whichever of the four a read came back as, and hands the fourth to
 * the caller.
 *
 * `nothing` is separate from `absent` on purpose: only the caller knows what an
 * empty answer means for its own subject, so only the caller writes that
 * sentence.
 */
export function Reading<T>({
  of,
  what,
  children,
  nothing,
}: {
  of: Read<T>
  /** The subject, as it appears in a sentence: "the Governor", "the work market". */
  what: string
  children: (value: T) => ReactNode
  nothing?: ReactNode
}) {
  if (of.at === 'reading') {
    return (
      <YStack gap="$2" padding="$4" borderRadius="$6" borderWidth={1} borderColor={line}>
        <SizableText size="$3" color={quiet}>
          Reading {what}…
        </SizableText>
      </YStack>
    )
  }

  if (of.at === 'absent') {
    return (
      <Answer
        title={`${what} is not deployed on this chain`}
        detail={
          <>
            The address on record answers <Mono>eth_getCode</Mono> with no code. That is not an
            empty {what} — there is nothing at {of.address} to be empty. Nothing on this screen is a
            statement about governance.
          </>
        }
      />
    )
  }

  if (of.at === 'failed') {
    return (
      <YStack
        gap="$2"
        padding="$4"
        borderRadius="$6"
        borderWidth={1}
        borderColor={bad}
        backgroundColor={surface}
      >
        <SizableText size="$4" color={plain}>
          {what} could not be read
        </SizableText>
        <Paragraph size="$3" margin={0} color={quiet}>
          The chain was asked and did not answer, so this screen knows nothing either way. A refusal
          is not an empty result.
        </Paragraph>
        <SizableText
          render="pre"
          display="block"
          margin={0}
          size="$2"
          color={quiet}
          fontFamily="$mono"
          whiteSpace="pre-wrap"
          wordWrap="break-word"
        >
          {of.why}
        </SizableText>
      </YStack>
    )
  }

  const empty = Array.isArray(of.value) && of.value.length === 0
  if (empty && nothing) return <>{nothing}</>
  return <>{children(of.value)}</>
}

/** Monospace inline, for an address, a selector or a call. */
export function Mono({ children }: { children: ReactNode }) {
  return (
    <SizableText size="$2" color={plain} fontFamily="$mono" wordWrap="break-word">
      {children}
    </SizableText>
  )
}
