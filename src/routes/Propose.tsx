import { Button } from '@hanzogui/button'
import { Input } from '@hanzogui/input'
import { Label } from '@hanzogui/label'
import { XStack, YStack } from '@hanzogui/stacks'
import { Paragraph, SizableText } from '@hanzogui/text'
import { useId, useState } from 'react'
import { isAddress, parseEther } from 'viem'
import * as chain from '../chrome/here'
import * as wallet from '../chrome/wallet'
import * as abi from '../gov/abi'
import { useRead } from '../gov/use'
import { Reading } from '../parts/answer'
import { Link } from '../parts/link'
import { Panel, Title } from '../parts/panel'
import { REACH, bad, good, line, plain, quiet, ring, surface } from '../parts/paint'
import { machine, units } from '../read/governance'
import { power } from '../read/power'

/**
 * Creating a proposal.
 *
 * A proposal is a set of calls plus a description, and the honest minimum is a
 * single transfer from the treasury: targets, values, calldatas, description.
 * Anything richer — a template gallery, an action builder over contracts nobody
 * has named — would be a form over calls this deployment has no way to check.
 *
 * The threshold is read before the form rather than after the rejection, since
 * "you need N and have M" is the whole of what somebody needs to know here and
 * the Governor will otherwise only say `GovernorInsufficientProposerVotes`.
 */
export default function Propose() {
  const here = chain.use()
  const session = wallet.use()
  const gov = useRead(() => machine(here), [here.key])
  const mine = useRead(() => power(here, session?.address ?? null), [here.key, session?.address])

  const [to, setTo] = useState('')
  const [amount, setAmount] = useState('')
  const [text, setText] = useState('')
  const [why, setWhy] = useState<string | null>(null)
  const [sent, setSent] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const idTo = useId()
  const idAmount = useId()
  const idText = useId()

  const submit = async () => {
    setBusy(true)
    setWhy(null)
    try {
      const w = wallet.writer()
      if (!w || !session) throw new Error('Connect a wallet to propose.')
      if (session.chainId !== here.id) await wallet.switchTo(here)
      const governor = here.at.governor
      if (!governor) throw new Error('This chain has no Governor on record.')
      if (!isAddress(to)) throw new Error('The recipient is not an address.')
      if (text.trim().length === 0) throw new Error('A proposal needs a description.')
      const value = parseEther(amount || '0')
      const hash = await w.writeContract({
        address: governor,
        abi: abi.governor,
        functionName: 'propose',
        args: [[to as `0x${string}`], [value], ['0x'], text],
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

  const field = (id: string, label: string, value: string, set: (s: string) => void, placeholder: string) => (
    <YStack gap="$2" maxWidth={520} minWidth={0}>
      <Label htmlFor={id} size="$2" color={quiet}>
        {label}
      </Label>
      <Input
        id={id}
        value={value}
        onChangeText={set}
        placeholder={placeholder}
        color={plain}
        borderColor={line}
        minHeight={REACH + 16}
      />
    </YStack>
  )

  return (
    <YStack gap="$6">
      <Title lede="A proposal is a set of calls the Timelock will make if it passes, and a description of why.">
        Create a proposal
      </Title>

      <Reading of={gov} what="the Governor">
        {(m) => (
          <Reading of={mine} what="your voting power">
            {(p) => {
              const enough = session ? p.votes >= m.proposalThreshold : false
              return (
                <YStack gap="$6">
                  <Panel title="What it takes">
                    <Paragraph size="$3" margin={0} color={quiet}>
                      {units(m.proposalThreshold, m.decimals)} {m.symbol} of delegated voting power is
                      needed to open a proposal.{' '}
                      {!session
                        ? 'Connect a wallet to see whether you have it.'
                        : enough
                          ? `You have ${units(p.votes, m.decimals)} ${m.symbol}.`
                          : `You have ${units(p.votes, m.decimals)} ${m.symbol}. A balance carries no weight until it is delegated — ${'you can delegate to yourself'}.`}
                    </Paragraph>
                    {session && !enough ? (
                      <Paragraph size="$3" margin={0} color={quiet}>
                        <Link href="/delegate">Delegate</Link>
                      </Paragraph>
                    ) : null}
                  </Panel>

                  <Panel
                    title="The proposal"
                    note={`One call, from the Timelock, in ${here.symbol}. It executes only if the proposal passes and the Timelock's delay elapses.`}
                  >
                    <YStack gap="$4">
                      {field(idTo, 'Send to', to, setTo, '0x…')}
                      {field(idAmount, `Amount in ${here.symbol}`, amount, setAmount, '0')}
                      {field(idText, 'Description', text, setText, 'What this does, and why')}

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
                          disabled={busy || !session}
                          aria-busy={busy}
                          onPress={() => void submit()}
                        >
                          <SizableText size="$3" color={plain}>
                            Propose
                          </SizableText>
                        </Button>
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
                  </Panel>
                </YStack>
              )
            }}
          </Reading>
        )}
      </Reading>
    </YStack>
  )
}
