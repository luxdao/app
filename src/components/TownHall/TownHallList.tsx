import { Box, Button, Flex, Grid, GridItem, Text, Badge } from '@chakra-ui/react';
import { Plus } from '@phosphor-icons/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TownHallSession } from '../../types/townHall';
import { CreateSessionModal } from './CreateSessionModal';

export function TownHallList() {
  const { t } = useTranslation('townHall');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [sessions] = useState<TownHallSession[]>([]);

  const getStatusColor = (status: TownHallSession['status']) => {
    switch (status) {
      case 'live':
        return 'green';
      case 'scheduled':
        return 'yellow';
      case 'ended':
        return 'gray';
    }
  };

  return (
    <Box>
      <Flex justifyContent="flex-end" mb={4}>
        <Button
          leftIcon={<Plus />}
          onClick={() => setIsCreateModalOpen(true)}
          variant="primary"
        >
          {t('createSession')}
        </Button>
      </Flex>

      {sessions.length === 0 ? (
        <Flex
          direction="column"
          alignItems="center"
          justifyContent="center"
          py={16}
          color="neutral-7"
        >
          <Text>{t('noSessions')}</Text>
        </Flex>
      ) : (
        <Grid templateColumns="repeat(auto-fill, minmax(300px, 1fr))" gap={4}>
          {sessions.map(session => (
            <GridItem key={session.id}>
              <Box
                p={4}
                borderRadius="lg"
                borderWidth={1}
                borderColor="neutral-3"
                _hover={{ borderColor: 'neutral-5' }}
              >
                <Flex justifyContent="space-between" alignItems="center" mb={2}>
                  <Text fontWeight="bold">{session.title}</Text>
                  <Badge colorScheme={getStatusColor(session.status)}>
                    {t(session.status)}
                  </Badge>
                </Flex>
                <Text color="neutral-7" fontSize="sm" noOfLines={2}>
                  {session.description}
                </Text>
              </Box>
            </GridItem>
          ))}
        </Grid>
      )}

      <CreateSessionModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </Box>
  );
}
