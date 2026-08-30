import { YStack } from '@hanzogui/stacks'
import { Title } from '../parts/panel'
import { Link } from '../parts/link'
import { Paragraph } from '@hanzogui/text'
import { quiet } from '../parts/paint'

export default function Missing() {
  return (
    <YStack gap="$6">
      <Title lede="This address does not name a screen in this interface.">Nothing here</Title>
      <Paragraph size="$3" margin={0} color={quiet}>
        <Link href="/">Overview</Link> · <Link href="/proposals">Proposals</Link> ·{' '}
        <Link href="/deployment">What is deployed</Link>
      </Paragraph>
    </YStack>
  )
}
