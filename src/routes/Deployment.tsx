import { YStack } from '@hanzogui/stacks'
import { Paragraph } from '@hanzogui/text'
import { useAsync } from '../gov/use'
import { Address } from '../parts/address'
import { Reading } from '../parts/answer'
import { Mark } from '../parts/mark'
import { Panel, Title } from '../parts/panel'
import { quiet } from '../parts/paint'
import { Table } from '../parts/table'
import { surveyAll, verdict, type Slotted } from '../read/deployment'

/**
 * What is on each chain, against what the records say.
 *
 * This screen is the one that is not written by hand. Every row is an
 * `eth_getCode` performed when the page opened, because the written records
 * disagree — with the chain and with one another. Two files name two different
 * work markets on one chain; a standard asserts as a hard invariant that a
 * Governor is zero bytes at an address that answers with fifteen thousand. A
 * table maintained by editing is a table that drifts, so this one cannot be
 * edited: there is nothing in it to edit.
 */
export default function Deployment() {
  const all = useAsync(() => surveyAll(), [])

  return (
    <YStack gap="$6">
      <Title lede="Every address on record, asked of its own chain when this screen opened. Nothing here is carried in the build.">
        What is deployed
      </Title>

      <Paragraph size="$3" margin={0} color={quiet} maxWidth={720}>
        A contract with no code answers a call with empty data rather than an error, so an interface
        that does not ask this question cannot tell an absent contract from an idle one. Zero bytes
        below is a measurement, not a missing value.
      </Paragraph>

      <Reading of={all} what="the chains">
        {(rows) => (
          <YStack gap="$6">
            {rows.map((s) => (
              <Panel
                key={s.venue.key}
                title={`${s.venue.name} · ${s.venue.id}`}
                note={
                  s.reachable
                    ? `Reachable at block ${s.block?.toLocaleString()} — ${verdict(s)}.`
                    : `Not reachable: ${s.why}`
                }
              >
                {s.reachable && s.chainId !== null && s.chainId !== s.venue.id ? (
                  <Paragraph size="$3" margin={0} color={quiet}>
                    This endpoint reports chain {s.chainId}, not {s.venue.id}. Every row below was
                    read from whatever chain that is.
                  </Paragraph>
                ) : null}
                <Table
                  caption={`Addresses on record for ${s.venue.name}`}
                  keyOf={(r: Slotted) => r.slot}
                  rows={s.slots}
                  columns={[
                    { head: 'Contract', cell: (r) => r.slot },
                    {
                      head: 'Address on record',
                      cell: (r) =>
                        r.address ? (
                          <Address at={r.address} explorer={s.venue.explorer} />
                        ) : (
                          <span>none recorded</span>
                        ),
                    },
                    {
                      head: 'Code',
                      align: 'right',
                      cell: (r) =>
                        r.size === null ? '—' : r.size === 0 ? '0 bytes' : `${r.size.toLocaleString()} bytes`,
                    },
                    {
                      head: 'Reading',
                      cell: (r) =>
                        r.address === null ? (
                          <Mark tone="plain">no record</Mark>
                        ) : r.size === null ? (
                          <Mark tone="warn">not read</Mark>
                        ) : r.size === 0 ? (
                          <Mark tone="bad">not deployed</Mark>
                        ) : (
                          <Mark tone="good">deployed</Mark>
                        ),
                    },
                  ]}
                />
              </Panel>
            ))}
          </YStack>
        )}
      </Reading>

      <Panel title="Why the four readings differ">
        <Paragraph size="$3" margin={0} color={quiet} maxWidth={720}>
          <strong>Deployed</strong> — code was found at the address. <strong>Not deployed</strong> —
          the chain was asked and returned no code; the address on record is empty.{' '}
          <strong>Not read</strong> — the call was refused or timed out, so nothing is known either
          way. <strong>No record</strong> — no file names an address for this contract on this chain.
          Only the second is a statement about the chain, and only the fourth is a statement about
          our own records.
        </Paragraph>
      </Panel>
    </YStack>
  )
}
