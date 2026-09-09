import { Button } from '@hanzogui/button'
import { XStack, YStack } from '@hanzogui/stacks'
import { Paragraph, SizableText } from '@hanzogui/text'
import { Appearance } from '@hanzo/appearance'
import * as chain from '../chrome/here'
import * as theme from '../chrome/theme'
import { useRead } from '../gov/use'
import { Address } from '../parts/address'
import { Reading } from '../parts/answer'
import { Facts, fact } from '../parts/facts'
import { Panel, Title } from '../parts/panel'
import { REACH, line, plain, quiet, ring, surface } from '../parts/paint'
import { duration, machine, units } from '../read/governance'

/** Governance parameters, and how this interface is drawn. */
export default function Settings() {
  const here = chain.use()
  const t = theme.use()
  const gov = useRead(() => machine(here), [here.key])

  return (
    <YStack gap="$6">
      <Title lede="What the Governor is configured with, and how this interface reads.">
        Settings
      </Title>

      <Reading of={gov} what="the Governor">
        {(m) => (
          <Panel
            title="Governance parameters"
            note={
              <>
                Set on the Governor at <Address at={m.address} explorer={here.explorer} />. Changing
                any of them is itself a proposal.
              </>
            }
          >
            <Facts
              rows={[
                fact('Voting delay', duration(m.votingDelay, m.clockMode)),
                fact('Voting period', duration(m.votingPeriod, m.clockMode)),
                fact('Proposal threshold', `${units(m.proposalThreshold, m.decimals)} ${m.symbol}`),
                fact('Quorum fraction', `${m.quorumNumerator}/${m.quorumDenominator}`),
                fact('Quorum now', `${units(m.quorum, m.decimals)} ${m.symbol}`),
                fact('Clock', m.clockMode),
                fact('Counting', m.counting),
              ]}
            />
          </Panel>
        )}
      </Reading>

      <Panel title="Chain" note="Which chain every screen reads.">
        <Facts
          min={200}
          max={2}
          rows={[fact('Reading', `${here.name} · ${here.id}`), fact('Endpoint', here.rpc)]}
        />
      </Panel>

      <Panel title="Theme">
        <XStack gap="$2" role="group" aria-label="Theme">
          {(['dark', 'light'] as const).map((k) => (
            <Button
              key={k}
              size="$3"
              minHeight={REACH + 16}
              paddingHorizontal="$4"
              borderRadius="$6"
              borderWidth={1}
              borderColor={t === k ? plain : line}
              backgroundColor={surface}
              focusVisibleStyle={ring}
              aria-pressed={t === k}
              onPress={() => theme.set(k)}
            >
              <SizableText size="$3" color={plain}>
                {k === 'dark' ? 'Dark' : 'Light'}
              </SizableText>
            </Button>
          ))}
        </XStack>
      </Panel>

      <Panel
        title="Appearance"
        note="The design system's own panel — type size, scale, spacing and width. Rendered rather than rebuilt: each control writes a custom property every ramp multiplies by, and a second set of controls over the same properties would be a second answer to a question that already has one."
      >
        {/* The picker is drawn by @hanzo/appearance and its letter buttons
            measure 23.8 across, under the 24 a target needs. The floor is
            granted here, on the subtree, because this is the caller and the
            package is not ours to restyle. */}
        <YStack data-reach="">
          <Appearance />
        </YStack>
      </Panel>
    </YStack>
  )
}
