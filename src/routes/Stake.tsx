import { Button } from '@hanzogui/button'
import { Input } from '@hanzogui/input'
import { Label } from '@hanzogui/label'
import { XStack, YStack } from '@hanzogui/stacks'
import { Paragraph, SizableText } from '@hanzogui/text'
import { useId, useState } from 'react'
import { parseUnits } from 'viem'
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
import { VE, WEEK, decay, ends, escrow, expired, holding, left, type Escrow, type Holding } from '../read/ve'

/** A tick of a timestamp clock, as a sentence. */
const when = (tick: bigint) =>
  new Date(Number(tick) * 1000).toISOString().replace('T', ' ').slice(0, 16) + ' UTC'

const days = (s: bigint) => `${(Number(s) / 86_400).toLocaleString(undefined, { maximumFractionDigits: 1 })} days`

const now = () => BigInt(Math.floor(Date.now() / 1000))

function Control({
  children,
  onPress,
  busy,
  off,
}: {
  children: string
  onPress: () => void
  busy: boolean
  off?: boolean
}) {
  return (
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
      disabled={busy || off}
      aria-busy={busy}
      onPress={onPress}
    >
      <SizableText size="$3" color={plain}>
        {children}
      </SizableText>
    </Button>
  )
}

/**
 * Vote escrow: locking, and what a lock is worth while it runs down.
 *
 * The screen is written against `read/ve`'s adapter rather than against a
 * contract, so a venue that locks a different token draws the same screen. The
 * two numbers worth putting beside each other are the weight the contract
 * reports and the weight the decay line predicts from the lock alone: they
 * agree while the escrow is checkpointing, and a reader who is only shown one
 * of them has no way to tell.
 */
export default function Stake() {
  const here = chain.use()
  const session = wallet.use()
  const who = session?.address ?? null
  const it = useRead(() => escrow(here, who), [here.key, who])

  return (
    <YStack gap="$6">
      <Title lede="Locking a token mints weight that decays to nothing at the end of the lock. The tokens come back when it ends, and not before.">
        Vote escrow
      </Title>
      <Reading of={it} what="the vote-escrow contract">
        {(e) => <Open it={e} />}
      </Reading>
    </YStack>
  )
}

function Open({ it: e }: { it: Escrow }) {
  const here = chain.use()
  const session = wallet.use()
  const who = session?.address ?? null
  const purse = useRead<Holding | null>(
    async () =>
      who
        ? holding(here, e.base as `0x${string}`, who, e.address as `0x${string}`)
        : { at: 'read', value: null },
    [here.key, who, e.base],
  )

  const [amount, setAmount] = useState('')
  const [weeks, setWeeks] = useState('52')
  const [why, setWhy] = useState<string | null>(null)
  const [sent, setSent] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const amountAt = useId()
  const weeksAt = useId()

  const t = now()
  const running = e.mine.amount > 0n && !expired(e.mine.end, t)
  const done = expired(e.mine.end, t)
  const modelled = decay(e.mine.amount, e.mine.end, t, e.max)

  /** Every write on this screen, so the wallet checks happen in one place. */
  const send = async (build: () => { to: `0x${string}`; abi: readonly unknown[]; call: { functionName: string; args: readonly unknown[] } }) => {
    setBusy(true)
    setWhy(null)
    setSent(null)
    try {
      const w = wallet.writer()
      if (!w || !session) throw new Error('Connect a wallet first.')
      if (session.chainId !== here.id) await wallet.switchTo(here)
      const { to, abi, call } = build()
      const hash = await w.writeContract({
        address: to,
        abi,
        functionName: call.functionName,
        args: call.args,
        account: session.address,
        chain: null,
      })
      setSent(hash)
    } catch (x) {
      setWhy(x instanceof Error ? x.message : String(x))
    } finally {
      setBusy(false)
    }
  }

  const wei = () => {
    const n = amount.trim()
    if (!n) throw new Error('Enter an amount.')
    return parseUnits(n, e.decimals)
  }

  const span = () => {
    const n = Number(weeks.trim())
    if (!Number.isFinite(n) || n <= 0) throw new Error('Enter a lock length in weeks.')
    return BigInt(Math.floor(n)) * WEEK
  }

  return (
    <YStack gap="$6">
      <Panel
        title={e.name}
        note={
          <>
            At <Address at={e.address} explorer={here.explorer} />, locking{' '}
            <Address at={e.base} explorer={here.explorer} />. Weight falls in a straight line to zero
            at the end of a lock: the same tokens locked twice as long are worth twice as much on the
            day they are locked, and nothing on the day they come out.
          </>
        }
      >
        <Facts
          rows={[
            fact('Locked', `${units(e.locked, e.decimals)}`),
            fact('Weight outstanding', `${units(e.supply, e.decimals)} ${e.symbol}`),
            fact('Shortest lock', days(e.min)),
            fact('Longest lock', days(e.max)),
            fact('Ends rounded to', e.step > 0n ? days(e.step) : 'nothing'),
          ]}
        />
        <Paragraph size="$3" margin={0} color={quiet}>
          {e.delegable
            ? 'Escrow weight on this contract can be delegated, so it can be tallied for an address other than the one that locked.'
            : 'Escrow weight on this contract cannot be delegated or transferred. It is counted for the address that locked and nowhere else, which is why the delegation screen is about the votes token rather than about this one.'}
          {e.step > 0n
            ? ' A lock end is floored to that step, so a lock asked for at the shortest length is asked for one step longer to survive the flooring.'
            : ''}
        </Paragraph>
      </Panel>

      <Panel title="Your lock">
        {!session ? (
          <Paragraph size="$3" margin={0} color={quiet}>
            Connect a wallet to read your lock. Nothing on this screen is about you until one is
            connected.
          </Paragraph>
        ) : (
          <YStack gap="$3">
            <Facts
              rows={[
                fact('Locked', e.mine.amount > 0n ? units(e.mine.amount, e.decimals) : null, 'nothing locked'),
                fact('Ends', e.mine.end > 0n ? when(e.mine.end) : null, 'no lock'),
                fact('Time left', e.mine.end > 0n ? days(left(e.mine.end, t)) : null, 'no lock'),
                fact('Weight now', `${units(e.mine.power, e.decimals)} ${e.symbol}`),
                fact('Weight the decay line predicts', `${units(modelled, e.decimals)} ${e.symbol}`),
              ]}
            />
            {done ? (
              <Paragraph size="$3" margin={0} color={quiet}>
                The lock has ended. It carries no weight and the tokens can be withdrawn.
              </Paragraph>
            ) : null}
          </YStack>
        )}
      </Panel>

      <Panel
        title={running ? 'Add to the lock, or extend it' : done ? 'Withdraw' : 'Lock'}
        note="Signed in your own wallet. Locking is two transactions: an approval, then the lock."
      >
        {!session ? (
          <Paragraph size="$3" margin={0} color={quiet}>
            Connect a wallet to lock.
          </Paragraph>
        ) : (
          <YStack gap="$4">
            <Reading of={purse} what="your balance of the locked token">
              {(p) =>
                p ? (
                  <Facts
                    rows={[
                      fact('Your balance', `${units(p.balance, p.decimals)} ${p.symbol}`),
                      fact('Approved for the escrow', `${units(p.allowance, p.decimals)} ${p.symbol}`),
                    ]}
                  />
                ) : (
                  <></>
                )
              }
            </Reading>

            {done ? null : (
              <YStack gap="$3" maxWidth={520}>
                <YStack gap="$2">
                  <Label htmlFor={amountAt} size="$2" color={quiet}>
                    Amount to lock
                  </Label>
                  <Input
                    id={amountAt}
                    value={amount}
                    onChangeText={setAmount}
                    placeholder="0.0"
                    inputMode="decimal"
                    color={plain}
                    borderColor={line}
                    minHeight={REACH + 16}
                  />
                </YStack>
                {
                  <YStack gap="$2">
                    <Label htmlFor={weeksAt} size="$2" color={quiet}>
                      {running ? 'Extend the end to, in weeks from now' : 'Lock length, in weeks'}
                    </Label>
                    <Input
                      id={weeksAt}
                      value={weeks}
                      onChangeText={setWeeks}
                      inputMode="numeric"
                      color={plain}
                      borderColor={line}
                      minHeight={REACH + 16}
                    />
                  </YStack>
                }
              </YStack>
            )}

            <XStack gap="$2" flexWrap="wrap">
              {done ? (
                <Control
                  busy={busy}
                  onPress={() =>
                    void send(() => ({
                      to: e.address as `0x${string}`,
                      abi: VE.abi,
                      call: VE.close(),
                    }))
                  }
                >
                  Withdraw
                </Control>
              ) : (
                <>
                  <Control
                    busy={busy}
                    onPress={() =>
                      void send(() => ({
                        to: e.base as `0x${string}`,
                        abi: abi.erc20,
                        call: { functionName: 'approve', args: [e.address as `0x${string}`, wei()] },
                      }))
                    }
                  >
                    Approve
                  </Control>
                  {running ? (
                    <>
                      <Control
                        busy={busy}
                        onPress={() =>
                          void send(() => ({
                            to: e.address as `0x${string}`,
                            abi: VE.abi,
                            call: VE.add(wei()),
                          }))
                        }
                      >
                        Add
                      </Control>
                      <Control
                        busy={busy}
                        onPress={() =>
                          void send(() => ({
                            to: e.address as `0x${string}`,
                            abi: VE.abi,
                            call: VE.extend(ends(now(), span(), e.min, e.max, e.step)),
                          }))
                        }
                      >
                        Extend
                      </Control>
                    </>
                  ) : (
                    <Control
                      busy={busy}
                      onPress={() =>
                        void send(() => ({
                          to: e.address as `0x${string}`,
                          abi: VE.abi,
                          call: VE.open(wei(), ends(now(), span(), e.min, e.max, e.step)),
                        }))
                      }
                    >
                      Lock
                    </Control>
                  )}
                </>
              )}
            </XStack>

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
  )
}
