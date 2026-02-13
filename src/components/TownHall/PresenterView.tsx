import { Box, Flex, Text } from '@chakra-ui/react';
import { VideoCamera } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';

interface PresenterViewProps {
  sessionId: string;
}

export function PresenterView({ sessionId }: PresenterViewProps) {
  const { t } = useTranslation('townHall');

  return (
    <Flex
      flex={1}
      bg="black"
      borderRadius="lg"
      alignItems="center"
      justifyContent="center"
      position="relative"
      minH="300px"
    >
      <Flex direction="column" alignItems="center" color="neutral-7">
        <VideoCamera size={48} />
        <Text mt={2}>{t('waitingForPresenter')}</Text>
      </Flex>
    </Flex>
  );
}
