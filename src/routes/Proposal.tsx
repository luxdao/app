import { Button } from '@hanzogui/button'
import { XStack, YStack } from '@hanzogui/stacks'
import { Paragraph, SizableText } from '@hanzogui/text'
import { useState } from 'react'
import { useParams } from 'react-router'
import * as chain from '../chrome/here'
import * as wallet from '../chrome/wallet'
import * as abi from '../gov/abi'
import { useRead } from '../gov/use'
import { Address } from '../parts/address'
import { Answer, Reading } from '../parts/answer'
import { Facts, fact } from '../parts/facts'
import { Link } from '../parts/link'
import { Mark } from '../parts/mark'
import { Panel, Title } from '../parts/panel'
import { REACH, bad, good, line, plain, quiet, ring, surface } from '../parts/paint'
import { machine, units } from '../read/governance'
import { SUPPORT, proposals, title } from '../read/proposals'

/** A moment on the Governor's clock, rendered in the unit that clock uses. */
const when = (tick: bigint, clockMode: string) =>
  clockMode.includes('timestamp')
    ? new Date(Number(tick) * 1000).toISOString().replace('T', ' ').slice(0, 16) + ' UTC'
    : `block ${tick.toLocaleString()}`

export default function Proposal() {
  const here = chain.use()
  const { id } = useParams()
  const session = wallet.use()
  const list = useRead(() => proposals(here), [here.key])
  const gov = useRead(() => machine(here), [here.key])
  const [why, setWhy] = useState<string | null>(null)
  const [sent, setSent] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const cast = async (support: number) => {
    setBusy(true)
    setWhy(null)
    try {
      const w = wallet.writer()
      if (!w || !session) throw new Error('Connect a wallet to cast a vote.')
      if (session.chainId !== here.id) await wallet.switchTo(here)
      const governor = here.at.governor
      if (!governor) throw new Error('This chain has no Governor on record.')
      const hash = await w.writeContract({
        address: governor,
        abi: abi.governor,
        functionName: 'castVote',
        args: [BigInt(id ?? '0'), support],
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
    <Reading of={list} what="the proposal register">
      {(rows) => {
        const p = rows.find((r) => r.id.toString() === id)
        if (!p) {
          return (
            <YStack gap="$6">
              <Title lede="No proposal with this id has been created on this Governor.">
                Nothing to show
              </Title>
              <Answer
                title="This link names no proposal"
                detail={
                  <>
                    The register was read in full and carries no proposal with that id.{' '}
                    <Link href="/proposals">All proposals</Link>.
                  </>
                }
              />
            </YStack>
          )
        }
        const m = gov.at === 'read' ? gov.value : null
        const d = m?.decimals ?? 18
        const total = p.for + p.against + p.abstain
        return (
          <YStack gap="$6">
            <Title lede={`Proposal on the ${here.name} Governor.`}>{title(p)}</Title>

            <XStack gap="$2" flexWrap="wrap" alignItems="center">
              <Mark tone={p.state === 'Active' ? 'good' : 'plain'}>{p.state}</Mark>
              <SizableText size="$2" color={quiet}>
                proposed by
              </SizableText>
              <Address at={p.proposer} explorer={here.explorer} />
            </XStack>

            <Panel title="Votes" note={m ? `Counted in ${m.symbol}, under ${m.counting}.` : undefined}>
              <Facts
                rows={[
                  fact('For', `${units(p.for, d)}${m ? ` ${m.symbol}` : ''}`),
                  fact('Against', `${units(p.against, d)}${m ? ` ${m.symbol}` : ''}`),
                  fact('Abstain', `${units(p.abstain, d)}${m ? ` ${m.symbol}` : ''}`),
                  fact('Cast so far', `${units(total, d)}${m ? ` ${m.symbol}` : ''}`),
                  fact('Quorum', m ? `${units(m.quorum, d)} ${m.symbol}` : null, 'Governor unread'),
                ]}
              />
              {m && total < m.quorum ? (
                <Paragraph size="$3" margin={0} color={quiet}>
                  Quorum has not been reached. {units(m.quorum - total, d)} {m.symbol} more would be
                  needed, and only delegated balances count toward it.
                </Paragraph>
              ) : null}
            </Panel>

            <Panel title="Window" note={m ? `The Governor's clock is ${m.clockMode}.` : undefined}>
              <Facts
                min={200}
                max={2}
                rows={[
                  fact('Opens', m ? when(p.voteStart, m.clockMode) : null, 'Governor unread'),
                  fact('Closes', m ? when(p.voteEnd, m.clockMode) : null, 'Governor unread'),
                ]}
              />
            </Panel>

            <Panel title="Cast a vote" note="Signed in your own wallet. Nothing here holds a key.">
              {!session ? (
                <Paragraph size="$3" margin={0} color={quiet}>
                  Connect a wallet to vote. Reading this page needed none.
                </Paragraph>
              ) : p.state !== 'Active' ? (
                <Paragraph size="$3" margin={0} color={quiet}>
                  This proposal is {p.state.toLowerCase()}, so the Governor will not accept a vote on
                  it. The buttons are left out rather than disabled, because there is nothing here to
                  enable.
                </Paragraph>
              ) : (
                <XStack gap="$2" flexWrap="wrap">
                  {SUPPORT.map((label, i) => (
                    <Button
                      key={label}
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
                      onPress={() => void cast(i)}
                    >
                      <SizableText size="$3" color={plain}>
                        {label}
                      </SizableText>
                    </Button>
                  ))}
                </XStack>
              )}
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
            </Panel>

            {p.description.trim() ? (
              <Panel title="Description">
                <SizableText
                  render="pre"
                  display="block"
                  margin={0}
                  size="$3"
                  color={plain}
                  fontFamily="$mono"
                  whiteSpace="pre-wrap"
                  wordWrap="break-word"
                >
                  {p.description}
                </SizableText>
              </Panel>
            ) : null}
          </YStack>
        )
      }}
    </Reading>
  )
}
