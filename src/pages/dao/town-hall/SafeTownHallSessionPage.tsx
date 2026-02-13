import { Box } from '@chakra-ui/react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { TownHallRoom } from '../../../components/TownHall/TownHallRoom';
import PageHeader from '../../../components/ui/page/Header/PageHeader';

export function SafeTownHallSessionPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { t } = useTranslation('townHall');

  if (!sessionId) {
    return null;
  }

  return (
    <Box>
      <PageHeader
        title={t('townHallSession')}
        breadcrumbs={[
          {
            terminus: t('townHall'),
            path: 'town-hall',
          },
          {
            terminus: t('townHallSession'),
            path: '',
          },
        ]}
      />
      <TownHallRoom sessionId={sessionId} />
    </Box>
  );
}
