import { useEffect } from 'react';
import { wsService } from '@/services/websocket';

export function useWebSocket(roomCode: string, playerId: string) {
  useEffect(() => {
    // Connect to WebSocket when component mounts
    wsService.connect(roomCode, playerId);

    // Disconnect when component unmounts
    return () => {
      wsService.disconnect();
    };
  }, [roomCode, playerId]);

  return wsService;
} 