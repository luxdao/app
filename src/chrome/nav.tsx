import { Button } from '@hanzogui/button'
import { brand } from './brand'
import { Popover, PopoverContent, PopoverTrigger } from '@hanzogui/popover'
import { XStack, YStack } from '@hanzogui/stacks'
import { SizableText } from '@hanzogui/text'
import { useState } from 'react'
import { useLocation } from 'react-router'
import { COLUMN, CONTROL, INSET, ROW, line, plain, quiet, ring, sheet, surface } from '../parts/paint'
import { useWalk } from '../parts/link'
import { Account } from './account'
import { Connect } from './connect'
import * as chain from './here'

/** A place in the header: where it goes, and what it is called. */
export type Place = readonly [to: string, label: string]

/**
 * The screens this stack serves. A fork adds its own with `more`, which is
 * appended rather than merged — the base's order is the base's to keep.
 */
export const WHERE: readonly Place[] = [
  ['/', 'Dashboard'],
  ['/proposals', 'Proposals'],
  ['/treasury', 'Treasury'],
  ['/work', 'Work'],
]

/**
 * The rest, behind one control.
 *
 * Nine words across a header is a list, not a menu: a reader scans all of them
 * to find the one they came for, and the row is the widest thing on the page.
 * Three stand in the open — the three a person opens this interface to do —
 * and the rest are one press away. Overview is not among either: the wordmark
 * is the way home, as it is everywhere else, and a second control pointing at
 * the same screen is a second answer to a settled question. Deployment is in
 * the colophon with the other records screens.
 */
export const MORE: readonly Place[] = [
  ['/delegate', 'Voting power'],
  ['/stake', 'Vote escrow'],
  ['/roles', 'Roles'],
  ['/karma', 'Karma'],
]

function Where({ to, label, panel, done }: { to: string; label: string; panel?: boolean; done?: () => void }) {
  const { pathname } = useLocation()
  const walk = useWalk(done)
  const here = to === '/' ? pathname === '/' : pathname.startsWith(to)
  return (
    <SizableText
      render={<a href={to} onClick={walk(to)} aria-current={here ? 'page' : undefined} />}
      display={panel ? 'flex' : 'inline-flex'}
      alignItems="center"
      minHeight={panel ? ROW : CONTROL}
      width={panel ? '100%' : undefined}
      paddingHorizontal={panel ? '$3' : 0}
      flexShrink={0}
      whiteSpace="nowrap"
      size="$3"
      color={here ? plain : quiet}
      hoverStyle={{ color: plain }}
    >
      {label}
    </SizableText>
  )
}

/** Which chain is being read. The whole tree is keyed on it. */
function Chain() {
  const at = chain.use()
  const [open, setOpen] = useState(false)
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          size="$2"
          minHeight={CONTROL}
          paddingHorizontal="$3"
          borderRadius="$12"
          borderWidth={1}
          borderColor={line}
          backgroundColor={surface}
          flexShrink={0}
          hoverStyle={{ borderColor: plain, backgroundColor: surface }}
          focusVisibleStyle={ring}
          aria-label={`Chain: ${at.name}. Choose another`}
        >
          <SizableText size="$3" color={plain}>
            {at.name}
          </SizableText>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        padding="$2"
        gap="$1"
        borderRadius="$6"
        borderWidth={1}
        borderColor={line}
        backgroundColor={sheet}
      >
        <YStack gap="$1" minWidth={200}>
          {chain.roster().map((v) => (
            <Button
              key={v.key}
              size="$2"
              minHeight={ROW}
              justifyContent="flex-start"
              paddingHorizontal="$3"
              borderRadius="$4"
              borderWidth={1}
              borderColor={v.key === at.key ? plain : 'transparent'}
              backgroundColor="transparent"
              hoverStyle={{ borderColor: plain }}
              focusVisibleStyle={ring}
              aria-current={v.key === at.key ? 'true' : undefined}
              onPress={() => {
                chain.go(v)
                setOpen(false)
              }}
            >
              <SizableText size="$3" color={plain}>
                {v.name} · {v.id}
              </SizableText>
            </Button>
          ))}
        </YStack>
      </PopoverContent>
    </Popover>
  )
}

/**
 * The header: a lockup that is also the way in, and who you are.
 *
 * The mark is the estate's glyph and not its wordmark. A wordmark is for a
 * marketing surface, where the name is the message; inside an app the corner
 * is a place you press, and a triangle at sixteen pixels is legible where five
 * letterforms are not. It is drawn as a disclosure — it turns when the menu is
 * open — because it IS the disclosure: nine words strung across a header is a
 * list a reader scans, and one press that opens all of them is a menu they
 * read once.
 */
export function Nav({ more = [] }: { more?: readonly Place[] }) {
  const [menu, setMenu] = useState(false)
  const it = brand()
  const where = [...WHERE, ...more, ...MORE]
  return (
    <YStack
      render="header"
      width="100%"
      borderBottomWidth={1}
      borderBottomColor={line}
      backgroundColor="transparent"
    >
      <XStack
        width="100%"
        maxWidth={COLUMN}
        marginHorizontal="auto"
        paddingHorizontal={INSET}
        paddingVertical="$2"
        alignItems="center"
        justifyContent="space-between"
        gap="$3"
        minWidth={0}
      >
        <Popover open={menu} onOpenChange={setMenu}>
          <PopoverTrigger asChild>
            <Button
              unstyled
              flexDirection="row"
              alignItems="center"
              gap="$2"
              minHeight={CONTROL}
              paddingHorizontal={0}
              backgroundColor="transparent"
              cursor="pointer"
              focusVisibleStyle={ring}
              aria-label={`${it.name} Vote. Open the menu`}
              aria-haspopup="menu"
              aria-expanded={menu}
            >
              {/* The glyph turns a half-turn when the menu opens, which is what
                  says it was the disclosure rather than a logo that happened to
                  be pressable. A reader who has asked for less motion is shown
                  the same two positions without the turn between them. */}
              <YStack
                style={{
                  color: plain,
                  transform: menu ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 160ms ease',
                }}
              >
                <it.glyph height={16} />
              </YStack>
              <SizableText size="$4" fontWeight="var(--weight-semibold)" color={plain} whiteSpace="nowrap">
                {it.name}
              </SizableText>
              <SizableText size="$4" color={quiet} whiteSpace="nowrap">
                {it.word}
              </SizableText>
            </Button>
          </PopoverTrigger>
          <PopoverContent
            padding="$2"
            borderRadius="$6"
            borderWidth={1}
            borderColor={line}
            backgroundColor={sheet}
          >
            <YStack gap="$1" minWidth={220} role="menu">
              {where.map(([to, label]) => (
                <Where key={to} to={to} label={label} panel done={() => setMenu(false)} />
              ))}
            </YStack>
          </PopoverContent>
        </Popover>

        {/* The chain being read, then the one control that says who is reading.
            Connecting a wallet IS signing in — it names an address and proves
            the key — so there is one door and not two beside each other. */}
        <XStack alignItems="center" gap="$2" flexShrink={0}>
          <Chain />
          <Connect />
          <Account />
        </XStack>
      </XStack>
    </YStack>
  )
}
