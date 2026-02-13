import { useCallback, useState } from 'react';
import { ChatMessage } from '../../types/townHall';

export function useTownHallChat(sessionId: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const sendMessage = useCallback((content: string) => {
    // TODO: Send via data channel
    const msg: ChatMessage = {
      id: crypto.randomUUID(),
      sender: '0x0000000000000000000000000000000000000000',
      content,
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, msg]);
  }, []);

  return { messages, sendMessage };
}
