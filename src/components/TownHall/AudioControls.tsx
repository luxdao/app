import { Box, Flex, IconButton, Tooltip } from '@chakra-ui/react';
import { Microphone, MicrophoneSlash, PhoneDisconnect } from '@phosphor-icons/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export function AudioControls() {
  const { t } = useTranslation('townHall');
  const [isMuted, setIsMuted] = useState(false);

  return (
    <Flex justifyContent="center" gap={4} py={4}>
      <Tooltip label={isMuted ? t('unmute') : t('mute')}>
        <IconButton
          aria-label={isMuted ? t('unmute') : t('mute')}
          icon={isMuted ? <MicrophoneSlash size={24} /> : <Microphone size={24} />}
          onClick={() => setIsMuted(!isMuted)}
          borderRadius="full"
          colorScheme={isMuted ? 'red' : 'gray'}
        />
      </Tooltip>
      <Tooltip label={t('leave')}>
        <IconButton
          aria-label={t('leave')}
          icon={<PhoneDisconnect size={24} />}
          colorScheme="red"
          borderRadius="full"
        />
      </Tooltip>
    </Flex>
  );
}
