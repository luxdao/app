import { Button } from '@hanzogui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@hanzogui/popover'
import { XStack, YStack } from '@hanzogui/stacks'
import { SizableText } from '@hanzogui/text'
import { useState } from 'react'
import { useLocation } from 'react-router'
import { COLUMN, CONTROL, INSET, ROW, line, plain, quiet, ring, surface } from '../parts/paint'
import { useWalk } from '../parts/link'
import { Connect } from './connect'
import * as chain from './here'

const WHERE = [
  ['/', 'Overview'],
  ['/proposals', 'Proposals'],
  ['/delegate', 'Voting power'],
  ['/treasury', 'Treasury'],
  ['/work', 'Work'],
  ['/roles', 'Roles'],
  ['/karma', 'Karma'],
  ['/deployment', 'Deployment'],
] as const

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

export function Nav() {
  const [menu, setMenu] = useState(false)
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
          >
            Lux Vote
          </SizableText>
          <XStack gap="$4" display="none" $gtSm={{ display: 'flex' }} alignItems="center" flexWrap="wrap">
            {WHERE.map(([to, label]) => (
              <Where key={to} to={to} label={label} />
            ))}
          </XStack>
        </XStack>

        <XStack alignItems="center" gap="$2" flexShrink={0}>
          <Chain />
          <Connect />
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
                {WHERE.map(([to, label]) => (
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
