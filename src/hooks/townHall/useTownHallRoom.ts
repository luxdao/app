import { useCallback, useState } from 'react';

export interface RoomState {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
}

export function useTownHallRoom(sessionId: string) {
  const [state, setState] = useState<RoomState>({
    isConnected: false,
    isConnecting: false,
    error: null,
  });

  const connect = useCallback(async (token: string) => {
    setState(prev => ({ ...prev, isConnecting: true, error: null }));
    try {
      // TODO: Connect to LiveKit room using token
      setState({ isConnected: true, isConnecting: false, error: null });
    } catch (err) {
      setState({
        isConnected: false,
        isConnecting: false,
        error: err instanceof Error ? err.message : 'Connection failed',
      });
    }
  }, []);

  const disconnect = useCallback(() => {
    // TODO: Disconnect from LiveKit room
    setState({ isConnected: false, isConnecting: false, error: null });
  }, []);

  return { ...state, connect, disconnect };
}
