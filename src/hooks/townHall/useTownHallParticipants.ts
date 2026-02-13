import { useState } from 'react';
import { TownHallParticipant } from '../../types/townHall';

export function useTownHallParticipants(sessionId: string) {
  const [participants, setParticipants] = useState<TownHallParticipant[]>([]);

  // TODO: Subscribe to LiveKit participant events

  return { participants };
}
