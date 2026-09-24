import { Button } from '@hanzogui/button'
import {
  Dialog, DialogClose, DialogContent, DialogDescription, DialogOverlay, DialogPortal, DialogTitle,
} from '@hanzogui/dialog'
import { XStack, YStack } from '@hanzogui/stacks'
import { Paragraph, SizableText } from '@hanzogui/text'
import { useIam } from '@hanzo/iam/react'
import { useEffect, useState } from 'react'
import { CONTROL, REACH, ROW, bad, line, plain, quiet, ring, surface } from '../parts/paint'
import { short } from '../parts/address'
import { brand } from './brand'
import * as id from './id'
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
  const { isAuthenticated, sdk } = useIam()
  const at = brand()
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
        // The tenant's name, not the estate's: this message is what the wallet
        // shows the reader, and on zoo.vote it has to say Zoo.
        statement: `Sign in to read and act on ${at.name} governance.`,
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
      {/* Where the credential is going, said before it is typed. The word on the
          control is short because a header is; the name a screen reader is given
          is the whole sentence, and on this bundle it names three hosts. */}
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
        aria-label={`Sign in with ${id.host(at.issuer)}`}
      >
        <SizableText size="$3" color={plain}>
          Sign in
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
              Sign in
            </DialogTitle>
            <DialogDescription size="$3" margin={0} color={quiet}>
              Reading needs neither. One is needed to delegate, propose or cast a vote.
            </DialogDescription>
          </YStack>

          {found === null ? (
            <SizableText size="$3" color={quiet}>
              Looking for wallets…
            </SizableText>
          ) : found.length === 0 ? (
            <Paragraph size="$3" margin={0} color={quiet}>
              No wallet announced itself to this page. A browser wallet extension has to be
              installed and enabled for this site; connecting a phone wallet by QR code is not
              offered here.
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

          {/* The other way in, in the same panel rather than beside it: a
              wallet proves a key and an issuer vouches for a person, and both
              answer the one question this control asks. */}
          {isAuthenticated ? null : (
            <Button
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
              aria-label={`Sign in with ${id.host(at.issuer)}`}
              onPress={() => void id.start(sdk).catch((e) => setWhy(e instanceof Error ? e.message : String(e)))}
            >
              <SizableText size="$4" color={plain}>
                Continue with {id.host(at.issuer)}
              </SizableText>
            </Button>
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
