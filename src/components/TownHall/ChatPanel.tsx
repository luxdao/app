import { Box, Flex, Input, Text, VStack } from '@chakra-ui/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChatMessage } from '../../types/townHall';

interface ChatPanelProps {
  sessionId: string;
}

export function ChatPanel({ sessionId }: ChatPanelProps) {
  const { t } = useTranslation('townHall');
  const [messages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;
    // TODO: Send message via data channel
    setInput('');
  };

  return (
    <Flex
      direction="column"
      flex={1}
      borderWidth={1}
      borderColor="neutral-3"
      borderRadius="lg"
      overflow="hidden"
    >
      <Box p={3} borderBottomWidth={1} borderColor="neutral-3">
        <Text fontWeight="bold" fontSize="sm">{t('chat')}</Text>
      </Box>
      <VStack flex={1} p={3} overflowY="auto" spacing={2} align="stretch">
        {messages.map(msg => (
          <Box key={msg.id}>
            <Text fontSize="xs" color="neutral-7">
              {msg.sender.slice(0, 6)}...{msg.sender.slice(-4)}
            </Text>
            <Text fontSize="sm">{msg.content}</Text>
          </Box>
        ))}
      </VStack>
      <Flex p={2} gap={2}>
        <Input
          size="sm"
          placeholder={t('typeMessage')}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
        />
      </Flex>
    </Flex>
  );
}
