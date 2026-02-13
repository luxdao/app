import { Box, Flex, Text } from '@chakra-ui/react';
import { Microphone } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { TownHallList } from '../../../components/TownHall/TownHallList';
import PageHeader from '../../../components/ui/page/Header/PageHeader';

export function SafeTownHallPage() {
  const { t } = useTranslation('townHall');

  return (
    <Box>
      <PageHeader
        title={t('townHall')}
        breadcrumbs={[
          {
            terminus: t('townHall'),
            path: '',
          },
        ]}
      />
      <TownHallList />
    </Box>
  );
}
