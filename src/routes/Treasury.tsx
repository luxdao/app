import { formatEther } from 'viem'
import { YStack } from '@hanzogui/stacks'
import { Paragraph } from '@hanzogui/text'
import * as chain from '../chrome/here'
import { useRead } from '../gov/use'
import { Address } from '../parts/address'
import { Reading } from '../parts/answer'
import { Facts, fact } from '../parts/facts'
import { Mark } from '../parts/mark'
import { Panel, Title } from '../parts/panel'
import { quiet } from '../parts/paint'
import { Table } from '../parts/table'
import { duration, machine } from '../read/governance'
import { treasury } from '../read/treasury'

/**
 * The treasury, which on this deployment is a Timelock and a Safe.
 *
 * Only the chain's own coin is shown. A token inventory needs an indexer, there
 * is none behind this build, and a treasury page that lists three tokens it
 * happens to know the address of is a page that understates the holdings while
 * looking complete.
 */
export default function Treasury() {
  const here = chain.use()
  const t = useRead(() => treasury(here), [here.key])
  const gov = useRead(() => machine(here), [here.key])

  return (
    <YStack gap="$6">
      <Title lede={`What the ${here.name} DAO controls, and what stands between a vote and a transfer.`}>
        Treasury
      </Title>

      <Reading of={t} what="the Timelock">
        {(v) => (
          <YStack gap="$6">
            <Panel
              title="The gate"
              note="A passed proposal does not move funds; it schedules a call that the Timelock releases after its delay."
            >
              <Paragraph size="$3" margin={0} color={quiet}>
                Whether any account beyond the Timelock holds its admin role is not shown, because it
                cannot be read: role membership is not enumerable, so answering would take a log scan
                and asserting it from one call would be a claim nobody measured.
              </Paragraph>
              <Facts
                rows={[
                  fact('Minimum delay', duration(v.minDelay, 'mode=timestamp')),
                  fact(
                    'Governor may schedule',
                    <Mark tone={v.governorProposes ? 'good' : 'warn'}>
                      {v.governorProposes ? 'yes' : 'no'}
                    </Mark>,
                  ),
                  fact(
                    'Execution',
                    <Mark tone="plain">{v.openExecutor ? 'open to anyone' : 'restricted'}</Mark>,
                  ),
                  fact(
                    'Administers itself',
                    <Mark tone="plain">{v.selfAdministered ? 'yes' : 'no'}</Mark>,
                  ),
                ]}
              />
              {!v.governorProposes ? (
                <Paragraph size="$3" margin={0} color={quiet}>
                  The Governor cannot schedule on this Timelock, so a passed proposal has no route to
                  execution here.
                </Paragraph>
              ) : null}
            </Panel>

            <Panel
              title="Holdings"
              note={`In ${here.symbol}, the chain's own coin. Token balances need an indexer and this build reads none, so none are shown.`}
            >
              <Table
                caption={`${here.symbol} held by the treasury contracts`}
                keyOf={(r) => r.address}
                rows={v.holdings}
                columns={[
                  { head: 'Contract', cell: (r) => r.what },
                  { head: 'Address', cell: (r) => <Address at={r.address} explorer={here.explorer} /> },
                  {
                    head: here.symbol,
                    align: 'right',
                    cell: (r) => Number(formatEther(r.balance)).toLocaleString(undefined, { maximumFractionDigits: 4 }),
                  },
                ]}
              />
            </Panel>
          </YStack>
        )}
      </Reading>

      {gov.at === 'read' ? (
        <Panel title="Route to execution">
          <Facts
            min={200}
            max={2}
            rows={[
              fact('Governor', <Address at={gov.value.address} explorer={here.explorer} />),
              fact('Timelock', <Address at={gov.value.timelock} explorer={here.explorer} />),
            ]}
          />
        </Panel>
      ) : null}
    </YStack>
  )
}
