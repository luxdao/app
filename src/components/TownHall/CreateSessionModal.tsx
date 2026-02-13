import {
  Button,
  FormControl,
  FormLabel,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Textarea,
} from '@chakra-ui/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface CreateSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateSessionModal({ isOpen, onClose }: CreateSessionModalProps) {
  const { t } = useTranslation('townHall');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const handleCreate = () => {
    // TODO: Create session via API
    onClose();
    setTitle('');
    setDescription('');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{t('createSession')}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <FormControl mb={4}>
            <FormLabel>{t('sessionTitle')}</FormLabel>
            <Input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder={t('sessionTitlePlaceholder')}
            />
          </FormControl>
          <FormControl>
            <FormLabel>{t('sessionDescription')}</FormLabel>
            <Textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder={t('sessionDescriptionPlaceholder')}
            />
          </FormControl>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            {t('cancel', { ns: 'common' })}
          </Button>
          <Button
            variant="primary"
            onClick={handleCreate}
            isDisabled={!title.trim()}
          >
            {t('create')}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
