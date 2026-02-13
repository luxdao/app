import { Box, Flex } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { PresenterView } from './PresenterView';
import { AudioControls } from './AudioControls';
import { ChatPanel } from './ChatPanel';
import { ParticipantList } from './ParticipantList';

interface TownHallRoomProps {
  sessionId: string;
}

export function TownHallRoom({ sessionId }: TownHallRoomProps) {
  const { t } = useTranslation('townHall');

  return (
    <Flex direction="column" h="calc(100vh - 200px)">
      <Flex flex={1} gap={4} overflow="hidden">
        <Flex direction="column" flex={1}>
          <PresenterView sessionId={sessionId} />
          <AudioControls />
        </Flex>
        <Flex direction="column" w="320px" gap={4}>
          <ParticipantList />
          <ChatPanel sessionId={sessionId} />
        </Flex>
      </Flex>
    </Flex>
  );
}
