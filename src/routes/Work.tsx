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
import { ZERO, board, standing, type Bounty, type State } from '../read/work'

/**
 * Open is proposed and unfunded, so it promises nothing yet — plain, not good.
 * Disputed is the one state where the two sides disagree about whose the
 * escrowed reward is, and it is the only one worth colouring as trouble.
 */
const tone: Record<State, Tone> = {
  None: 'plain',
  Open: 'plain',
  Funded: 'good',
  Claimed: 'warn',
  Submitted: 'warn',
  Accepted: 'good',
  Paid: 'good',
  Disputed: 'bad',
  Cancelled: 'plain',
}

const coin = (wei: bigint, symbol: string) =>
  `${Number(formatEther(wei)).toLocaleString(undefined, { maximumFractionDigits: 4 })} ${symbol}`

/**
 * A reward is one of four kinds of thing and only the first two are amounts.
 *
 * An ERC-20 is shown in its own units because its decimals are another call
 * and this screen has not made it. An NFT reward is a token id, where the
 * reward number is a quantity of that id rather than a value.
 */
const reward = (b: Bounty, symbol: string): string => {
  switch (b.rewardKind) {
    case 'Native':
      return coin(b.reward, symbol)
    case 'ERC20':
      return `${b.reward.toString()} (ERC-20 units)`
    case 'ERC721':
      return `#${b.rewardTokenId.toString()} (ERC-721)`
    case 'ERC1155':
      return `${b.reward.toString()} × #${b.rewardTokenId.toString()} (ERC-1155)`
  }
}

/** The stake is always fungible: a share of an NFT cannot be slashed. */
const stake = (b: Bounty, symbol: string): string =>
  b.stakeToken === ZERO ? coin(b.stake, symbol) : `${b.stake.toString()} (ERC-20 units)`

export default function Work() {
  const here = chain.use()
  const session = wallet.use()
  const bounties = useRead(() => board(here), [here.key])
  const me = useRead(() => standing(here, session?.address ?? null), [here.key, session?.address])

  return (
    <YStack gap="$6">
      <Title
        lede={`Bounties on ${here.name}. A worker stakes to claim one; the reward is released when the approver accepts, or by anyone once the review window has run out.`}
      >
        Work
      </Title>

      <Reading
        of={bounties}
        what="the work market"
        nothing={
          <Answer
            title="No bounty has been proposed"
            detail="The market answered: its count is zero. Nothing has been proposed here, which is different from a board that failed to load."
          />
        }
      >
        {(rows) => (
          <Panel title={`${rows.length} ${rows.length === 1 ? 'bounty' : 'bounties'}`}>
            <Table
              caption="Bounties on this market"
              keyOf={(r) => r.id.toString()}
              rows={rows}
              columns={[
                { head: '#', cell: (r) => r.id.toString() },
                { head: 'State', cell: (r) => <Mark tone={tone[r.state]}>{r.state}</Mark> },
                { head: 'Reward', align: 'right', cell: (r) => reward(r, here.symbol) },
                { head: 'Stake', align: 'right', cell: (r) => stake(r, here.symbol) },
                { head: 'Funder', cell: (r) => <Address at={r.funder} explorer={here.explorer} /> },
                {
                  head: 'Worker',
                  cell: (r) =>
                    r.worker === ZERO ? <span>unclaimed</span> : <Address at={r.worker} explorer={here.explorer} />,
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
                Append-only, with one writer fixed at initialize — the market at{' '}
                <Address at={s.writer} explorer={here.explorer} />. It is not a token and cannot be
                transferred. Earnings sum the reward amounts recorded on completion, and those
                rewards are not all the same asset, so the total is in units rather than in{' '}
                {here.symbol}.
              </>
            }
          >
            <Facts
              min={200}
              max={3}
              rows={[
                fact('Your completions', session ? s.completed.toString() : null, 'no wallet connected'),
                fact('Disputes lost', session ? s.disputesLost.toString() : null, 'no wallet connected'),
                fact('Recorded earnings', session ? s.earned.toString() : null, 'no wallet connected'),
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
