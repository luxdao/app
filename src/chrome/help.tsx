import { Button } from '@hanzogui/button'
import {
  Dialog, DialogClose, DialogContent, DialogDescription, DialogOverlay, DialogPortal, DialogTitle,
} from '@hanzogui/dialog'
import { XStack, YStack } from '@hanzogui/stacks'
import { SizableText } from '@hanzogui/text'
import { useState } from 'react'
import { Link } from '../parts/link'
import { REACH, line, plain, quiet, ring, sheet } from '../parts/paint'
import { brand } from './brand'
import * as chain from './here'

/**
 * The corner.
 *
 * What a screen does not say is still worth being able to ask, and the place to
 * ask it is the same on every screen — a mark in the corner rather than a
 * paragraph under each panel. It is what let the screens lose their standing
 * explanations: the answer moved here, once, instead of being written eight
 * times in the middle of the work.
 *
 * A question mark and not a gear: half of what it holds is a setting and half
 * is a fact about how this interface reads a chain, and somebody arrives
 * wanting the second half.
 */

/** How far off each edge the mark sits, and the room the press takes outside
 *  it — the mark keeps its drawn size and the target clears WCAG 2.2. */
const EDGE = 20
const MARK = 20
const SLACK = (REACH + 8 - MARK) / 2

export function Help() {
  const [open, setOpen] = useState(false)
  const here = chain.use()
  const it = brand()
  return (
    <Dialog modal open={open} onOpenChange={setOpen}>
      <Button
        unstyled
        aria-label="About this interface"
        aria-haspopup="dialog"
        aria-expanded={open}
        onPress={() => setOpen(true)}
        position="fixed"
        right={EDGE - SLACK}
        bottom={EDGE - SLACK}
        zIndex={1}
        width={REACH + 8}
        height={REACH + 8}
        borderRadius={REACH + 8}
        alignItems="center"
        justifyContent="center"
        padding={0}
        backgroundColor="transparent"
        cursor="pointer"
        focusVisibleStyle={ring}
        // From the laptop width up: below it the reading column runs to both
        // edges and a mark in the corner is a mark on the text.
        display="none"
        $gtSm={{ display: 'flex' }}
      >
        <svg width={MARK} height={MARK} viewBox="0 0 24 24" fill="none"
          stroke={plain} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" role="img"
          aria-hidden="true">
          <circle cx="12" cy="12" r="9.25" />
          <path d="M9.5 9.2a2.6 2.6 0 1 1 3.2 2.5c-.5.15-.7.5-.7 1v.6" />
          <path d="M12 16.6h.01" />
        </svg>
      </Button>
      <DialogPortal>
        <DialogOverlay key="overlay" backgroundColor="rgba(0,0,0,0.3)" />
        <DialogContent
          key="content"
          gap="$4"
          padding="$5"
          width="100%"
          maxWidth={420}
          borderRadius="$8"
          borderWidth={1}
          borderColor={line}
          backgroundColor={sheet}
        >
          <YStack gap="$1">
            <DialogTitle size="$6" margin={0} color={plain}>
              {it.name} {it.word}
            </DialogTitle>
            <DialogDescription size="$3" margin={0} color={quiet}>
              Every figure is read from {here.name} at {here.id} when a screen opens. You sign every
              transaction in your own wallet.
            </DialogDescription>
          </YStack>
          <YStack gap="$2">
            <Link href="/deployment">Smart contracts</Link>
            <Link href="/gauges">Gauges</Link>
            <Link href="/settings">Settings</Link>
          </YStack>
          <XStack justifyContent="flex-end">
            <DialogClose asChild>
              <Button
                size="$2"
                minHeight={REACH + 8}
                paddingHorizontal="$3"
                borderRadius="$12"
                borderWidth={1}
                borderColor={line}
                backgroundColor="transparent"
                focusVisibleStyle={ring}
              >
                <SizableText size="$3" color={quiet}>
                  Close
                </SizableText>
              </Button>
            </DialogClose>
          </XStack>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  )
}
