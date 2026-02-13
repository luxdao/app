import { Address } from 'viem';

export type TownHallStatus = 'scheduled' | 'live' | 'ended';

export type TownHallRole = 'presenter' | 'participant';

export interface TownHallSession {
  id: string;
  title: string;
  description: string;
  daoAddress: Address;
  creator: Address;
  presenter: Address;
  status: TownHallStatus;
  startTime: number;
  endTime?: number;
}

export interface TownHallParticipant {
  address: Address;
  role: TownHallRole;
  isMuted: boolean;
  hasVideo: boolean;
}

export interface ChatMessage {
  id: string;
  sender: Address;
  content: string;
  timestamp: number;
}
