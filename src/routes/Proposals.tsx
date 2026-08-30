import { YStack } from '@hanzogui/stacks'
import { Paragraph } from '@hanzogui/text'
import * as chain from '../chrome/here'
import { useRead } from '../gov/use'
import { Address } from '../parts/address'
import { Answer, Reading } from '../parts/answer'
import { Link } from '../parts/link'
import { Mark, type Tone } from '../parts/mark'
import { Panel, Title } from '../parts/panel'
import { quiet } from '../parts/paint'
import { Table } from '../parts/table'
import { machine, units } from '../read/governance'
import { proposals, title, type State } from '../read/proposals'

const tone: Record<State, Tone> = {
  Pending: 'plain', Active: 'good', Canceled: 'plain', Defeated: 'bad',
  Succeeded: 'good', Queued: 'warn', Expired: 'plain', Executed: 'good',
}

export default function Proposals() {
  const here = chain.use()
  const list = useRead(() => proposals(here), [here.key])
  const gov = useRead(() => machine(here), [here.key])
  const decimals = gov.at === 'read' ? gov.value.decimals : 18
  const symbol = gov.at === 'read' ? gov.value.symbol : ''

  return (
    <YStack gap="$6">
      <Title lede={`Every proposal ever created on the ${here.name} Governor, read from its own logs.`}>
        Proposals
      </Title>

      <Reading
        of={list}
        what="the proposal register"
        nothing={
          <Answer
            title="No proposal has ever been created"
            detail={
              <>
                This is not an empty page. Every block from the Governor's creation to the head of
                the chain was scanned for a <code>ProposalCreated</code> log and there are none — so
                the register is empty because governance has not been used, not because a read
                failed. <Link href="/proposals/new">Creating one</Link> needs{' '}
                {gov.at === 'read' ? `${units(gov.value.proposalThreshold, decimals)} ${symbol}` : 'a threshold balance'}{' '}
                of delegated voting power.
              </>
            }
          />
        }
      >
        {(rows) => (
          <Panel title={`${rows.length} ${rows.length === 1 ? 'proposal' : 'proposals'}`}>
            <Table
              caption="Proposals on this Governor"
              keyOf={(r) => r.id.toString()}
              rows={rows}
              columns={[
                {
                  head: 'Proposal',
                  cell: (r) => <Link href={`/proposals/${r.id}`}>{title(r)}</Link>,
                },
                { head: 'State', cell: (r) => <Mark tone={tone[r.state]}>{r.state}</Mark> },
                { head: 'Proposer', cell: (r) => <Address at={r.proposer} explorer={here.explorer} /> },
                { head: 'For', align: 'right', cell: (r) => units(r.for, decimals) },
                { head: 'Against', align: 'right', cell: (r) => units(r.against, decimals) },
                { head: 'Abstain', align: 'right', cell: (r) => units(r.abstain, decimals) },
              ]}
            />
          </Panel>
        )}
      </Reading>

      <Paragraph size="$3" margin={0} color={quiet}>
        <Link href="/proposals/new">Create a proposal</Link>
      </Paragraph>
    </YStack>
  )
}
