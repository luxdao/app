import { Grid } from '@hanzo/ui/grid'
import { YStack } from '@hanzogui/stacks'
import { Paragraph } from '@hanzogui/text'
import * as chain from '../chrome/here'
import * as wallet from '../chrome/wallet'
import { useRead } from '../gov/use'
import { Address } from '../parts/address'
import { Answer, Reading } from '../parts/answer'
import { Facts, fact } from '../parts/facts'
import { Link } from '../parts/link'
import { Mark } from '../parts/mark'
import { Panel, Title } from '../parts/panel'
import { quiet } from '../parts/paint'
import { duration, machine, units } from '../read/governance'
import { proposals } from '../read/proposals'
import { power } from '../read/power'

/**
 * The front door: what governs this chain, and whether anybody can use it.
 *
 * The second half is the one that matters here and is usually left out. A
 * Governor can be deployed, configured and correct while being unusable —
 * because no token holder has delegated, so the votes that exist are zero and
 * quorum is unreachable. That is the live condition on Lux and this screen
 * says it in those words rather than showing a tidy parameter table.
 */
export default function Overview() {
  const here = chain.use()
  const session = wallet.use()
  const gov = useRead(() => machine(here), [here.key])
  const list = useRead(() => proposals(here), [here.key])
  const mine = useRead(() => power(here, session?.address ?? null), [here.key, session?.address])

  return (
    <YStack gap="$6">
      <Title lede={`Governance on ${here.name}, read from the chain at ${here.id} when this screen opened.`}>
        {here.name} governance
      </Title>

      <Reading of={gov} what="the Governor">
        {(m) => (
          <YStack gap="$6">
            <Panel
              title={m.name}
              note={
                <>
                  Version {m.version}, at <Address at={m.address} explorer={here.explorer} />. It
                  tallies {m.symbol}, and its clock runs on{' '}
                  {m.clockMode.includes('timestamp') ? 'timestamps' : 'block numbers'} — so the two
                  durations below are {m.clockMode.includes('timestamp') ? 'wall-clock' : 'block counts'}.
                </>
              }
            >
              <Facts
                rows={[
                  fact('Voting delay', duration(m.votingDelay, m.clockMode)),
                  fact('Voting period', duration(m.votingPeriod, m.clockMode)),
                  fact('To propose', `${units(m.proposalThreshold, m.decimals)} ${m.symbol}`),
                  fact(
                    'Quorum',
                    `${units(m.quorum, m.decimals)} ${m.symbol} (${m.quorumNumerator}/${m.quorumDenominator} of supply)`,
                  ),
                  fact('Counting', m.counting),
                  fact('Tallied token', <Address at={m.token} explorer={here.explorer} />),
                ]}
              />
            </Panel>

            <Grid columns={{ min: 320, max: 2 }} gap="$4">
              <Reading
                of={list}
                what="the proposal register"
                nothing={
                  <Panel title="Proposals" note="No proposal has ever been created on this Governor.">
                    <Paragraph size="$3" margin={0} color={quiet}>
                      That is a scan of every block from the Governor's own creation to the head of
                      the chain, not a page that failed to load.{' '}
                      <Link href="/proposals">The register</Link> shows the same, with the range it
                      covered.
                    </Paragraph>
                  </Panel>
                }
              >
                {(rows) => (
                  <Panel
                    title="Proposals"
                    note={`${rows.length} ${rows.length === 1 ? 'proposal has' : 'proposals have'} been created on this Governor.`}
                  >
                    <Paragraph size="$3" margin={0} color={quiet}>
                      <Link href="/proposals">Open the register</Link>
                    </Paragraph>
                  </Panel>
                )}
              </Reading>

              <Reading of={mine} what="voting power">
                {(p) => (
                  <Panel
                    title="Can anyone vote?"
                    note={
                      p.totalSupply === 0n
                        ? `No ${p.symbol} has been issued.`
                        : `${units(p.totalSupply, p.decimals)} ${p.symbol} exists.`
                    }
                  >
                    <YStack gap="$3">
                      <Paragraph size="$3" margin={0} color={quiet}>
                        A balance carries no weight until it is delegated. Quorum on this Governor is{' '}
                        {gov.at === 'read' ? `${units(gov.value.quorum, p.decimals)} ${p.symbol}` : 'unread'}.
                      </Paragraph>
                      <Facts
                        min={200}
                        max={2}
                        rows={[
                          fact('Your balance', session ? `${units(p.balance, p.decimals)} ${p.symbol}` : null, 'no wallet connected'),
                          fact('Your votes', session ? `${units(p.votes, p.decimals)} ${p.symbol}` : null, 'no wallet connected'),
                        ]}
                      />
                      <Paragraph size="$3" margin={0} color={quiet}>
                        <Link href="/delegate">Delegate</Link>
                      </Paragraph>
                    </YStack>
                  </Panel>
                )}
              </Reading>
            </Grid>
          </YStack>
        )}
      </Reading>

      <Panel
        title="What else is on this chain"
        note="Every row is measured when the screen opens, never carried in the build."
      >
        <Paragraph size="$3" margin={0} color={quiet}>
          <Link href="/deployment">The deployment survey</Link> asks each chain for the code at every
          address on record, and shows where the records and the chain disagree.
        </Paragraph>
      </Panel>
    </YStack>
  )
}
