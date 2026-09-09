import { YStack } from '@hanzogui/stacks'
import { Paragraph, SizableText } from '@hanzogui/text'
import type { ReactNode } from 'react'
import type { Read } from '../gov/read'
import { CORNER, bad, line, plain, quiet, surface } from './paint'

/**
 * What a screen says when it has no rows to draw.
 *
 * The four outcomes are four different sentences and this is the component that
 * keeps them apart. "There is no contract at this address" and "this contract
 * has nothing yet" are the two most often collapsed into one another, and the
 * collapse always favours the reassuring reading: an empty list looks like a
 * young DAO rather than an absent one.
 */
/** A subject at the start of a sentence. `what` reads mid-sentence elsewhere. */
const up = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

export function Answer({ title, detail }: { title: string; detail?: ReactNode }) {
  return (
    <YStack
      gap="$2"
      padding="$4"
      borderRadius={CORNER}
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
      <YStack gap="$2" padding="$4" borderRadius={CORNER} borderWidth={1} borderColor={line}>
        <SizableText size="$3" color={quiet}>
          Reading {what}…
        </SizableText>
      </YStack>
    )
  }

  if (of.at === 'unrecorded') {
    return (
      <Answer
        title={`No address is recorded for ${what} on this chain`}
        detail={
          <>
            This is a statement about our own records rather than about the chain: nothing here has
            been asked of it, so nothing is known about whether such a contract exists.
          </>
        }
      />
    )
  }

  if (of.at === 'absent') {
    return (
      <Answer
        title={`${up(what)} is not deployed on this chain`}
        detail={
          <>
            The address on record — <Mono>{of.address}</Mono> — answers <Mono>eth_getCode</Mono> with
            no code, so there is nothing there to be empty. This is not an empty register; it is the
            absence of the contract that would keep one.
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
        borderRadius={CORNER}
        borderWidth={1}
        borderColor={bad}
        backgroundColor={surface}
      >
        <SizableText size="$4" color={plain}>
          {up(what)} could not be read
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
