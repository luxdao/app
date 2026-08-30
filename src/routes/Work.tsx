import { formatEther } from 'viem'
import { YStack } from '@hanzogui/stacks'
import { Paragraph } from '@hanzogui/text'
import * as chain from '../chrome/here'
import * as wallet from '../chrome/wallet'
import { useRead } from '../gov/use'
import { Address } from '../parts/address'
import { Answer, Reading } from '../parts/answer'
import { Facts, fact } from '../parts/facts'
import { Mark, type Tone } from '../parts/mark'
import { Panel, Title } from '../parts/panel'
import { quiet } from '../parts/paint'
import { Table } from '../parts/table'
import { NATIVE, board, standing, type Status } from '../read/work'

const tone: Record<Status, Tone> = {
  None: 'plain', Open: 'good', Claimed: 'warn', Submitted: 'warn', Released: 'good', Cancelled: 'plain',
}

/**
 * The work market: funded tasks, escrowed on posting, paid on approval.
 *
 * The status vocabulary here is the deployed contract's, which is shorter than
 * the one LP-0020 describes in prose — there is no separate escrow, no arbiter
 * and no dispute state in `contracts/work/Bounty.sol`. Naming states the
 * contract does not have would be describing a machine that is not running.
 */
export default function Work() {
  const here = chain.use()
  const session = wallet.use()
  const tasks = useRead(() => board(here), [here.key])
  const me = useRead(() => standing(here, session?.address ?? null), [here.key, session?.address])

  return (
    <YStack gap="$6">
      <Title lede={`Funded tasks on ${here.name}. A reward is escrowed when a task is posted and released when it is approved.`}>
        Work
      </Title>

      <Reading
        of={tasks}
        what="the work market"
        nothing={
          <Answer
            title="No task has been posted"
            detail="The market answered: its task count is zero. Nothing has been posted here, which is different from a board that failed to load."
          />
        }
      >
        {(rows) => (
          <Panel title={`${rows.length} ${rows.length === 1 ? 'task' : 'tasks'}`}>
            <Table
              caption="Tasks on this market"
              keyOf={(r) => r.id.toString()}
              rows={rows}
              columns={[
                { head: '#', cell: (r) => r.id.toString() },
                { head: 'Status', cell: (r) => <Mark tone={tone[r.status]}>{r.status}</Mark> },
                {
                  head: 'Reward',
                  align: 'right',
                  cell: (r) =>
                    r.token === NATIVE
                      ? `${Number(formatEther(r.reward)).toLocaleString(undefined, { maximumFractionDigits: 4 })} ${here.symbol}`
                      : `${r.reward.toString()} (token)`,
                },
                { head: 'Poster', cell: (r) => <Address at={r.poster} explorer={here.explorer} /> },
                {
                  head: 'Worker',
                  cell: (r) =>
                    r.worker === NATIVE ? <span>unclaimed</span> : <Address at={r.worker} explorer={here.explorer} />,
                },
              ]}
            />
          </Panel>
        )}
      </Reading>

      <Reading of={me} what="the contribution ledger">
        {(s) => (
          <Panel
            title="Contribution"
            note={
              <>
                Append-only, with one writer fixed at construction — the market at{' '}
                <Address at={s.writer} explorer={here.explorer} />. It is not a token and cannot be
                transferred.
              </>
            }
          >
            <Facts
              min={200}
              max={2}
              rows={[
                fact('Your completions', session ? s.completed.toString() : null, 'no wallet connected'),
                fact('Your score', session ? s.score.toString() : null, 'no wallet connected'),
              ]}
            />
            {!session ? (
              <Paragraph size="$3" margin={0} color={quiet}>
                A ledger entry belongs to an address, and there is no way to enumerate them — so
                nothing is shown until a wallet names one.
              </Paragraph>
            ) : null}
          </Panel>
        )}
      </Reading>
    </YStack>
  )
}
