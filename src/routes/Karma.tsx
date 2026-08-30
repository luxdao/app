import { YStack } from '@hanzogui/stacks'
import { Paragraph } from '@hanzogui/text'
import * as chain from '../chrome/here'
import * as wallet from '../chrome/wallet'
import { useRead } from '../gov/use'
import { Address } from '../parts/address'
import { Reading } from '../parts/answer'
import { Facts, fact } from '../parts/facts'
import { Mark } from '../parts/mark'
import { Panel, Title } from '../parts/panel'
import { quiet } from '../parts/paint'
import { units } from '../read/governance'
import { karma } from '../read/karma'

/**
 * Karma — soulbound, and deliberately not an ERC20.
 *
 * There is no holder list to read: the contract emits no Transfer and its
 * balances are reachable only one address at a time. So this screen shows the
 * supply and, if a wallet is connected, that wallet's own score. A leaderboard
 * would have to be invented, and inventing it is the thing this interface exists
 * not to do.
 */
export default function Karma() {
  const here = chain.use()
  const session = wallet.use()
  const k = useRead(() => karma(here, session?.address ?? null), [here.key, session?.address])

  return (
    <YStack gap="$6">
      <Title lede="Reputation that cannot be bought, sold or sent. It is earned, it decays with inactivity, and it is bound to one address.">
        Karma
      </Title>

      <Reading of={k} what="the Karma contract">
        {(v) => (
          <YStack gap="$6">
            <Panel
              title={v.name}
              note={
                <>
                  {v.symbol}, at <Address at={v.address} explorer={here.explorer} />. Non-transferable:
                  its transfer and approve entry points revert unconditionally.
                </>
              }
            >
              <Facts
                rows={[
                  fact('In circulation', `${units(v.totalSupply, v.decimals)} ${v.symbol}`),
                  fact('Cap per account', `${units(v.cap, v.decimals)} ${v.symbol}`),
                ]}
              />
            </Panel>

            <Panel title="Your standing">
              {session ? (
                <Facts
                  rows={[
                    fact('Karma', `${units(v.mine, v.decimals)} ${v.symbol}`),
                    fact('Verified', <Mark tone={v.verified ? 'good' : 'plain'}>{v.verified ? 'yes' : 'no'}</Mark>),
                    fact(
                      'Active this month',
                      <Mark tone={v.activeThisMonth ? 'good' : 'warn'}>{v.activeThisMonth ? 'yes' : 'no'}</Mark>,
                    ),
                  ]}
                />
              ) : (
                <Paragraph size="$3" margin={0} color={quiet}>
                  Karma belongs to an address and there is no way to enumerate holders — so nothing
                  is shown until a wallet names one.
                </Paragraph>
              )}
            </Panel>
          </YStack>
        )}
      </Reading>
    </YStack>
  )
}
