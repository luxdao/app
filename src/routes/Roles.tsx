import { YStack } from '@hanzogui/stacks'
import { Paragraph } from '@hanzogui/text'
import * as chain from '../chrome/here'
import * as wallet from '../chrome/wallet'
import { useRead } from '../gov/use'
import { Answer, Reading } from '../parts/answer'
import { Mark } from '../parts/mark'
import { Panel, Title } from '../parts/panel'
import { quiet } from '../parts/paint'
import { Table } from '../parts/table'
import { registry } from '../read/roles'

/**
 * Roles — our own registry, not Hats.
 *
 * A role's name lives in the `RoleCreated` log and nowhere else on chain, and
 * wearers are not enumerable at all. So this screen shows ids, parents and
 * counts, and says plainly that the names are not stored rather than inventing
 * labels for them.
 */
export default function Roles() {
  const here = chain.use()
  const session = wallet.use()
  const rows = useRead(() => registry(here, session?.address ?? null), [here.key, session?.address])

  return (
    <YStack gap="$6">
      <Title lede={`Who may act on behalf of the ${here.name} DAO. To administer a role is to wear its parent.`}>
        Roles
      </Title>

      <Reading
        of={rows}
        what="the role registry"
        nothing={
          <Answer
            title="The registry holds no roles"
            detail="It answered with a role count of zero."
          />
        }
      >
        {(list) => (
          <Panel
            title={`${list.length} ${list.length === 1 ? 'role' : 'roles'}`}
            note="A role's name is carried only in the log that created it, so ids are what the chain can be asked for."
          >
            <Table
              caption="Roles in this registry"
              keyOf={(r) => r.id.toString()}
              rows={list}
              columns={[
                { head: 'Role', cell: (r) => r.id.toString() },
                { head: 'Administered by', cell: (r) => r.admin.toString() },
                { head: 'Wearers', align: 'right', cell: (r) => r.supply.toString() },
                {
                  head: 'Limit',
                  align: 'right',
                  cell: (r) => (r.maxSupply === 0 ? 'unbounded' : String(r.maxSupply)),
                },
                {
                  head: 'You',
                  cell: (r) => (session ? <Mark tone={r.mine ? 'good' : 'plain'}>{r.mine ? 'wearing' : 'no'}</Mark> : '—'),
                },
              ]}
            />
            {!session ? (
              <Paragraph size="$3" margin={0} color={quiet}>
                Connect a wallet to see which of these you wear.
              </Paragraph>
            ) : null}
          </Panel>
        )}
      </Reading>
    </YStack>
  )
}
