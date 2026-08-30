import { Button } from '@hanzogui/button'
import {
  Dialog, DialogClose, DialogContent, DialogDescription, DialogOverlay, DialogPortal, DialogTitle,
} from '@hanzogui/dialog'
import { XStack, YStack } from '@hanzogui/stacks'
import { Paragraph, SizableText } from '@hanzogui/text'
import { useEffect, useState } from 'react'
import { CONTROL, REACH, ROW, bad, line, plain, quiet, ring, surface } from '../parts/paint'
import { short } from '../parts/address'
import * as wallet from './wallet'

/**
 * Signing in.
 *
 * Two steps, and they are genuinely two: connecting names an address, and
 * signing the CAIP-122 message proves the person holds its key. Reading needs
 * neither — every screen in this interface works with no wallet at all — so the
 * connect button is never a gate in front of the page.
 */
export function Connect() {
  const session = wallet.use()
  const [open, setOpen] = useState(false)
  const [found, setFound] = useState<wallet.Injected[] | null>(null)
  const [why, setWhy] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!open) return
    setFound(null)
    setWhy(null)
    wallet.announced().then(setFound)
  }, [open])

  const pick = async (w: wallet.Injected) => {
    setBusy(true)
    setWhy(null)
    try {
      await wallet.connect(w)
      // The login proof is minted and signed through @luxwallet/connect, which
      // is the one place a signature is asked for. It is separate from the
      // connection on purpose: the address is knowledge, the signature is proof.
      // Both halves by their own entry point, never through the root barrel or
      // `getConnector`. The factory's switch names all seven chains and the
      // barrel re-exports it, so a bundler follows every branch and stops on
      // the Bitcoin and TON SDKs — optional peers this build has no reason to
      // install. The package ships each piece separately for exactly this
      // caller. The dev server resolved the barrel happily and only
      // `vite build` found it, which is the argument for running the build
      // before believing a change is finished.
      const [{ newChallenge }, { EvmConnector }] = await Promise.all([
        import('@luxwallet/connect/nonce'),
        import('@luxwallet/connect/evm/connect'),
      ])
      const connector = new EvmConnector()
      const challenge = newChallenge({
        domain: window.location.host,
        uri: window.location.origin,
        statement: 'Sign in to read and act on Lux governance.',
      })
      const account = await connector.connect(w.id)
      await connector.signLogin(account, challenge)
      wallet.proved()
      setOpen(false)
    } catch (e) {
      setWhy(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  if (session) {
    return (
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
        aria-label={`Disconnect ${session.address}`}
        onPress={() => wallet.disconnect()}
      >
        <SizableText size="$3" color={plain}>
          {short(session.address)}
        </SizableText>
      </Button>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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
        onPress={() => setOpen(true)}
      >
        <SizableText size="$3" color={plain}>
          Connect
        </SizableText>
      </Button>

      <DialogPortal>
        <DialogOverlay
          key="overlay"
          backgroundColor="rgba(0,0,0,0.6)"
        />
        <DialogContent
          key="content"
          gap="$4"
          padding="$5"
          width="100%"
          maxWidth={420}
          borderRadius="$8"
          borderWidth={1}
          borderColor={line}
          backgroundColor={surface}
        >
          <YStack gap="$1">
            <DialogTitle size="$6" margin={0} color={plain}>
              Connect a wallet
            </DialogTitle>
            <DialogDescription size="$3" margin={0} color={quiet}>
              Reading needs no wallet. One is needed to delegate, propose or cast a vote — and every
              transaction is signed in your own wallet.
            </DialogDescription>
          </YStack>

          {found === null ? (
            <SizableText size="$3" color={quiet}>
              Looking for wallets…
            </SizableText>
          ) : found.length === 0 ? (
            <Paragraph size="$3" margin={0} color={quiet}>
              No wallet announced itself to this page. A browser wallet extension has to be
              installed and enabled for this site.
            </Paragraph>
          ) : (
            <YStack gap="$2">
              {found.map((w) => (
                <Button
                  key={w.id}
                  size="$3"
                  minHeight={ROW}
                  justifyContent="flex-start"
                  paddingHorizontal="$3"
                  borderRadius="$6"
                  borderWidth={1}
                  borderColor={line}
                  backgroundColor="transparent"
                  hoverStyle={{ borderColor: plain }}
                  focusVisibleStyle={ring}
                  disabled={busy}
                  aria-busy={busy}
                  onPress={() => void pick(w)}
                >
                  <SizableText size="$4" color={plain}>
                    {w.name}
                  </SizableText>
                </Button>
              ))}
            </YStack>
          )}

          {why ? (
            <Paragraph size="$3" margin={0} color={bad}>
              {why}
            </Paragraph>
          ) : null}

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
