import { Button } from '@hanzogui/button'
import { brand } from './brand'
import { Popover, PopoverContent, PopoverTrigger } from '@hanzogui/popover'
import { XStack, YStack } from '@hanzogui/stacks'
import { SizableText } from '@hanzogui/text'
import { useState } from 'react'
import { useLocation } from 'react-router'
import { COLUMN, CONTROL, INSET, ROW, line, plain, quiet, ring, surface } from '../parts/paint'
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
  ['/', 'Overview'],
  ['/proposals', 'Proposals'],
  ['/delegate', 'Voting power'],
  ['/treasury', 'Treasury'],
  ['/work', 'Work'],
  ['/roles', 'Roles'],
  ['/karma', 'Karma'],
  ['/stake', 'Vote escrow'],
  ['/deployment', 'Deployment'],
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
        backgroundColor={surface}
      >
        <YStack gap="$1" minWidth={200}>
          {chain.VENUES.map((v) => (
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

export function Nav({ more = [] }: { more?: readonly Place[] }) {
  const [menu, setMenu] = useState(false)
  const it = brand()
  const where = [...WHERE, ...more]
  return (
    <YStack
      render="header"
      width="100%"
      borderBottomWidth={1}
      borderBottomColor={line}
      backgroundColor={surface}
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
        <XStack alignItems="center" gap="$4" flexShrink={1} minWidth={0}>
          <SizableText
            render={<a href="/" onClick={useWalk()('/')} />}
            display="inline-flex"
            alignItems="center"
            minHeight={CONTROL}
            size="$5"
            fontWeight="600"
            color={plain}
            whiteSpace="nowrap"
            flexShrink={0}
            gap="$2"
            aria-label={`${it.name} Vote`}
          >
            {/* The tenant's own mark and the word the mark does not already
                say. Drawn, not fetched — an <img> lands after a round trip and
                shifts the row it sits in, on the first thing a person looks at.
                It takes currentColor, so it moves with the theme rather than
                with the desktop. */}
            <it.mark />
            {it.word}
          </SizableText>
          <XStack gap="$4" display="none" $gtSm={{ display: 'flex' }} alignItems="center" flexWrap="wrap">
            {where.map(([to, label]) => (
              <Where key={to} to={to} label={label} />
            ))}
          </XStack>
        </XStack>

        {/* The chain being read, then the key that can act on it, then the
            account that says who is reading. Three separate authorities in the
            order they matter to a reader, and none of them a gate in front of
            the other two. */}
        <XStack alignItems="center" gap="$2" flexShrink={0}>
          <Chain />
          <Connect />
          <Account />
          <Popover open={menu} onOpenChange={setMenu}>
            <PopoverTrigger asChild>
              <Button
                size="$2"
                minHeight={CONTROL}
                paddingHorizontal="$3"
                borderRadius="$12"
                borderWidth={1}
                borderColor={line}
                backgroundColor={surface}
                display="flex"
                $gtSm={{ display: 'none' }}
                focusVisibleStyle={ring}
                aria-label="Open the menu"
              >
                <SizableText size="$3" color={plain}>
                  Menu
                </SizableText>
              </Button>
            </PopoverTrigger>
            <PopoverContent
              padding="$2"
              borderRadius="$6"
              borderWidth={1}
              borderColor={line}
              backgroundColor={surface}
            >
              <YStack gap="$1" minWidth={200}>
                {where.map(([to, label]) => (
                  <Where key={to} to={to} label={label} panel done={() => setMenu(false)} />
                ))}
              </YStack>
            </PopoverContent>
          </Popover>
        </XStack>
      </XStack>
    </YStack>
  )
}
