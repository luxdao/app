import { Button } from '@hanzogui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@hanzogui/popover'
import { Separator } from '@hanzogui/separator'
import { XStack, YStack } from '@hanzogui/stacks'
import { Paragraph, SizableText } from '@hanzogui/text'
import { useIam } from '@hanzo/iam/react'
import { useEffect, useState, type ReactNode } from 'react'
import { short } from '../parts/address'
import { CONTROL, MEASURE, REACH, ROW, bad, line, plain, quiet, ring, surface } from '../parts/paint'
import { brand } from './brand'
import * as id from './id'

/**
 * The account control, and the one place this app talks about who you are.
 *
 * It starts a sign-in, shows what IAM said, and ends the session. It collects
 * nothing: no password, no code, no form. The credential is typed at the
 * issuer's own origin and what comes back is a token — which is the whole reason
 * there is no auth in this repository to review.
 *
 * Signed out, the interface is exactly what it was before: every screen reads
 * the chain, and `chrome/connect.tsx` still connects a wallet and signs with it.
 * Signing in is not a gate in front of the page and is not a prerequisite for
 * casting a vote — the Governor has never heard of IAM and counts a signature.
 */

/** The sentence the popover says about the wallets IAM records. */
function Wallets({ me }: { me: id.Identity }) {
  if (me.wallets === null) {
    return (
      <Paragraph size="$2" margin={0} color={quiet}>
        IAM reports no wallets for this account. That is a statement about the token, not about the
        account: the claim is absent, so nothing is known either way.
      </Paragraph>
    )
  }
  if (me.wallets.length === 0) {
    return (
      <Paragraph size="$2" margin={0} color={quiet}>
        IAM records no wallet for this account.
      </Paragraph>
    )
  }
  return (
    <YStack gap="$1">
      {me.wallets.map((w) => (
        <SizableText key={`${w.chain ?? ''}:${w.address}`} size="$2" color={plain} fontFamily="$mono">
          {w.chain ? `${w.chain} · ` : ''}
          {short(w.address)}
        </SizableText>
      ))}
      <Paragraph size="$2" margin={0} color={quiet}>
        {me.connected === null
          ? 'No wallet is connected to this page.'
          : me.linked
            ? 'The connected wallet is one of them.'
            : 'The connected wallet is not one of them, so this account has not claimed it.'}
      </Paragraph>
    </YStack>
  )
}

export function Account() {
  const { isAuthenticated, isLoading, sdk, logout } = useIam()
  const me = id.useIdentity()
  const [open, setOpen] = useState(false)
  const [why, setWhy] = useState<string | null>(null)
  const at = brand()

  // Nothing rather than "Sign in" while the stored token is being read: a
  // signed-in reader would otherwise be told they are signed out for a frame,
  // which is the one thing this control must never say by accident.
  if (isLoading) return null

  // Signed out, this control draws nothing: connecting a wallet IS signing in —
  // it names an address and proves the key — so the two doors that stood beside
  // each other are one, and `chrome/connect.tsx` is it. This is what a session
  // looks like once there is one.
  if (!isAuthenticated) return null

  const called = me.name ?? (me.subject ? short(me.subject) : 'this account')

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
          aria-label={`Signed in as ${called}. Account`}
        >
          <SizableText size="$3" color={plain}>
            {called}
          </SizableText>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        padding="$4"
        gap="$3"
        borderRadius="$6"
        borderWidth={1}
        borderColor={line}
        backgroundColor={surface}
      >
        <YStack gap="$3" minWidth={260} maxWidth={MEASURE}>
          <YStack gap="$1">
            <SizableText size="$2" color={quiet}>
              Signed in at {id.host(at.issuer)}
            </SizableText>
            {me.subject ? (
              <SizableText size="$2" color={plain} fontFamily="$mono" wordWrap="break-word">
                {me.subject}
              </SizableText>
            ) : null}
          </YStack>

          <Separator borderColor={line} />

          <YStack gap="$1">
            <SizableText size="$2" color={quiet}>
              Decentralised identifier
            </SizableText>
            {me.did ? (
              <SizableText size="$2" color={plain} fontFamily="$mono" wordWrap="break-word">
                {me.did}
              </SizableText>
            ) : (
              <Paragraph size="$2" margin={0} color={quiet}>
                IAM binds no DID to this account.
              </Paragraph>
            )}
          </YStack>

          <Separator borderColor={line} />

          <YStack gap="$1">
            <SizableText size="$2" color={quiet}>
              Wallets
            </SizableText>
            <Wallets me={me} />
          </YStack>

          <XStack justifyContent="flex-end">
            <Button
              size="$2"
              minHeight={ROW}
              paddingHorizontal="$3"
              borderRadius="$12"
              borderWidth={1}
              borderColor={line}
              backgroundColor="transparent"
              hoverStyle={{ borderColor: plain }}
              focusVisibleStyle={ring}
              aria-label={`Sign out of ${id.host(at.issuer)}`}
              onPress={() => {
                setOpen(false)
                void logout()
              }}
            >
              <SizableText size="$3" color={plain}>
                Sign out
              </SizableText>
            </Button>
          </XStack>
        </YStack>
      </PopoverContent>
    </Popover>
  )
}

/**
 * The far end of the round trip.
 *
 * The issuer returns the browser to `/auth/callback`, which is a step in a
 * redirect and not a screen — so it is answered here, above the router, rather
 * than by a route that would have to exist on every fork and would render a
 * heading for a page nobody reads. The code is exchanged by the SDK; the URL is
 * then replaced with the page the reader was on, so the callback leaves no
 * history entry to walk back into.
 */
export function Returning({ children }: { children: ReactNode }) {
  const { handleCallback } = useIam()
  const [state, setState] = useState<'exchanging' | 'done' | { why: string }>(() =>
    window.location.pathname === id.RETURN ? 'exchanging' : 'done',
  )

  useEffect(() => {
    if (state !== 'exchanging') return
    let live = true
    handleCallback().then(
      () => {
        if (!live) return
        window.history.replaceState(null, '', id.was())
        setState('done')
      },
      (e: unknown) => live && setState({ why: e instanceof Error ? e.message : String(e) }),
    )
    return () => {
      live = false
    }
  }, [state, handleCallback])

  if (state === 'done') return <>{children}</>

  return (
    <YStack padding="$6" gap="$3" maxWidth={MEASURE}>
      {state === 'exchanging' ? (
        <SizableText size="$3" color={quiet}>
          Completing sign-in…
        </SizableText>
      ) : (
        <>
          <SizableText size="$4" color={plain}>
            Sign-in did not complete
          </SizableText>
          <Paragraph size="$3" margin={0} color={quiet}>
            Nothing was read and nothing was signed. The interface works without an account.
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
            {state.why}
          </SizableText>
          <SizableText
            render={<a href="/" />}
            display="inline-flex"
            alignItems="center"
            minHeight={REACH + 8}
            size="$3"
            color={plain}
          >
            Continue without signing in
          </SizableText>
        </>
      )}
    </YStack>
  )
}
