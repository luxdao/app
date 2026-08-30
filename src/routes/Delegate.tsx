import { Button } from '@hanzogui/button'
import { Input } from '@hanzogui/input'
import { Label } from '@hanzogui/label'
import { XStack, YStack } from '@hanzogui/stacks'
import { Paragraph, SizableText } from '@hanzogui/text'
import { useId, useState } from 'react'
import * as chain from '../chrome/here'
import * as wallet from '../chrome/wallet'
import * as abi from '../gov/abi'
import { useRead } from '../gov/use'
import { Address } from '../parts/address'
import { Reading } from '../parts/answer'
import { Facts, fact } from '../parts/facts'
import { Panel, Title } from '../parts/panel'
import { REACH, bad, good, line, plain, quiet, ring, surface } from '../parts/paint'
import { units } from '../read/governance'
import { NOBODY, escrow, power } from '../read/power'

/**
 * Voting power, and the gap between holding and being able to vote.
 *
 * The delegation step is the one that surprises people, and it is the one this
 * chain has never taken: the whole supply sits undelegated, so the total voting
 * power on a correctly deployed Governor is zero. A screen that showed a
 * balance and called it power would be telling the holder something false.
 */
export default function Delegate() {
  const here = chain.use()
  const session = wallet.use()
  const mine = useRead(() => power(here, session?.address ?? null), [here.key, session?.address])
  const lock = useRead(() => escrow(here, session?.address ?? null), [here.key, session?.address])
  const [to, setTo] = useState('')
  const [why, setWhy] = useState<string | null>(null)
  const [sent, setSent] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const field = useId()

  const delegate = async (target: string) => {
    setBusy(true)
    setWhy(null)
    try {
      const w = wallet.writer()
      if (!w || !session) throw new Error('Connect a wallet to delegate.')
      if (session.chainId !== here.id) await wallet.switchTo(here)
      const token = here.at.votes
      if (!token) throw new Error('This chain has no votes token on record.')
      if (!/^0x[a-fA-F0-9]{40}$/.test(target)) throw new Error('That is not an address.')
      const hash = await w.writeContract({
        address: token,
        abi: abi.votes,
        functionName: 'delegate',
        args: [target as `0x${string}`],
        account: session.address,
        chain: null,
      })
      setSent(hash)
    } catch (e) {
      setWhy(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <YStack gap="$6">
      <Title lede="A balance carries no weight until it is delegated — to someone else, or to yourself.">
        Voting power
      </Title>

      <Reading of={mine} what="the votes token">
        {(p) => (
          <YStack gap="$6">
            <Panel
              title={`${p.symbol} on ${here.name}`}
              note={
                <>
                  The token the Governor tallies, at{' '}
                  <Address at={p.token} explorer={here.explorer} />.
                </>
              }
            >
              <Facts
                rows={[
                  fact('Total supply', `${units(p.totalSupply, p.decimals)} ${p.symbol}`),
                  fact('Your balance', session ? `${units(p.balance, p.decimals)} ${p.symbol}` : null, 'no wallet connected'),
                  fact('Your voting power', session ? `${units(p.votes, p.decimals)} ${p.symbol}` : null, 'no wallet connected'),
                  fact(
                    'Delegated to',
                    session ? (p.delegate === NOBODY ? 'nobody' : <Address at={p.delegate} explorer={here.explorer} />) : null,
                    'no wallet connected',
                  ),
                ]}
              />
              {session && p.delegate === NOBODY && p.balance > 0n ? (
                <Paragraph size="$3" margin={0} color={quiet}>
                  You hold {units(p.balance, p.decimals)} {p.symbol} and none of it can vote. Delegating
                  to yourself is what turns a balance into voting power; it moves no tokens.
                </Paragraph>
              ) : null}
            </Panel>

            <Panel title="Delegate" note="Signed in your own wallet. Delegation moves no tokens.">
              {!session ? (
                <Paragraph size="$3" margin={0} color={quiet}>
                  Connect a wallet to delegate.
                </Paragraph>
              ) : (
                <YStack gap="$3">
                  <XStack gap="$2" flexWrap="wrap">
                    <Button
                      size="$3"
                      minHeight={REACH + 16}
                      paddingHorizontal="$4"
                      borderRadius="$6"
                      borderWidth={1}
                      borderColor={line}
                      backgroundColor={surface}
                      hoverStyle={{ borderColor: plain }}
                      focusVisibleStyle={ring}
                      disabled={busy}
                      aria-busy={busy}
                      onPress={() => void delegate(session.address)}
                    >
                      <SizableText size="$3" color={plain}>
                        Delegate to myself
                      </SizableText>
                    </Button>
                  </XStack>

                  <YStack gap="$2" maxWidth={520}>
                    <Label htmlFor={field} size="$2" color={quiet}>
                      Or delegate to another address
                    </Label>
                    <Input
                      id={field}
                      value={to}
                      onChangeText={setTo}
                      placeholder="0x…"
                      color={plain}
                      borderColor={line}
                      minHeight={REACH + 16}
                    />
                    <XStack>
                      <Button
                        size="$3"
                        minHeight={REACH + 16}
                        paddingHorizontal="$4"
                        borderRadius="$6"
                        borderWidth={1}
                        borderColor={line}
                        backgroundColor={surface}
                        hoverStyle={{ borderColor: plain }}
                        focusVisibleStyle={ring}
                        disabled={busy || to.length === 0}
                        aria-busy={busy}
                        onPress={() => void delegate(to)}
                      >
                        <SizableText size="$3" color={plain}>
                          Delegate
                        </SizableText>
                      </Button>
                    </XStack>
                  </YStack>

                  {sent ? (
                    <Paragraph size="$3" margin={0} color={good}>
                      Sent. Transaction {sent}
                    </Paragraph>
                  ) : null}
                  {why ? (
                    <Paragraph size="$3" margin={0} color={bad}>
                      {why}
                    </Paragraph>
                  ) : null}
                </YStack>
              )}
            </Panel>
          </YStack>
        )}
      </Reading>

      <Reading of={lock} what="the vote-escrow contract">
        {(e) => (
          <Panel
            title={e.name}
            note={
              <>
                A separate instrument from the tally: {e.symbol} is earned by locking, and its weight
                decays as the lock runs down. At <Address at={e.address} explorer={here.explorer} />.
              </>
            }
          >
            <Facts
              rows={[
                fact('Total locked', units(e.totalLocked, 18)),
                fact('Escrow supply', units(e.totalSupply, 18)),
                fact('Shortest lock', `${Number(e.minLock) / 86400} days`),
                fact('Longest lock', `${Math.round(Number(e.maxLock) / 86400)} days`),
                fact('Your lock', session ? units(e.locked, 18) : null, 'no wallet connected'),
              ]}
            />
          </Panel>
        )}
      </Reading>
    </YStack>
  )
}
