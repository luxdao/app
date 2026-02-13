import { Box, Flex, Text, VStack, Badge } from '@chakra-ui/react';
import { User } from '@phosphor-icons/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TownHallParticipant } from '../../types/townHall';

export function ParticipantList() {
  const { t } = useTranslation('townHall');
  const [participants] = useState<TownHallParticipant[]>([]);

  return (
    <Box
      borderWidth={1}
      borderColor="neutral-3"
      borderRadius="lg"
      maxH="200px"
      overflow="hidden"
    >
      <Box p={3} borderBottomWidth={1} borderColor="neutral-3">
        <Text fontWeight="bold" fontSize="sm">
          {t('participants')} ({participants.length})
        </Text>
      </Box>
      <VStack p={3} overflowY="auto" spacing={1} align="stretch">
        {participants.map(p => (
          <Flex key={p.address} alignItems="center" gap={2}>
            <User size={16} />
            <Text fontSize="sm">
              {p.address.slice(0, 6)}...{p.address.slice(-4)}
            </Text>
            {p.role === 'presenter' && (
              <Badge colorScheme="purple" fontSize="xs">{t('presenter')}</Badge>
            )}
          </Flex>
        ))}
      </VStack>
    </Box>
  );
}
