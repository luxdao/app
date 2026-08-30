import { YStack } from '@hanzogui/stacks'
import * as chain from '../chrome/here'
import { useRead } from '../gov/use'
import { Address } from '../parts/address'
import { Answer, Reading } from '../parts/answer'
import { Mark } from '../parts/mark'
import { Panel, Title } from '../parts/panel'
import { Table } from '../parts/table'
import { gauges } from '../read/gauges'

/** Where fees are directed, weighted by vote-escrow. */
export default function Gauges() {
  const here = chain.use()
  const g = useRead(() => gauges(here), [here.key])

  return (
    <YStack gap="$6">
      <Title lede="Fee direction, weighted by vote-escrowed balances rather than by raw holdings.">
        Gauges
      </Title>

      <Reading of={g} what="the gauge controller">
        {(v) =>
          v.rows.length === 0 ? (
            <Answer
              title="No gauge has been added"
              detail="The controller answered with a gauge count of zero, so there is nothing to weight."
            />
          ) : (
            <Panel
              title={`${v.rows.length} ${v.rows.length === 1 ? 'gauge' : 'gauges'}`}
              note={`Total weight ${v.totalWeight.toString()}.`}
            >
              <Table
                caption="Gauges and their weights"
                keyOf={(r) => r.id.toString()}
                rows={v.rows}
                columns={[
                  { head: '#', cell: (r) => r.id.toString() },
                  { head: 'Name', cell: (r) => r.name },
                  { head: 'Recipient', cell: (r) => <Address at={r.recipient} explorer={here.explorer} /> },
                  { head: 'Active', cell: (r) => <Mark tone={r.active ? 'good' : 'plain'}>{r.active ? 'yes' : 'no'}</Mark> },
                  { head: 'Weight', align: 'right', cell: (r) => r.weight.toString() },
                ]}
              />
            </Panel>
          )
        }
      </Reading>
    </YStack>
  )
}
