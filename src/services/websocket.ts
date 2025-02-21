type MessageType = 'JOIN_GAME' | 'PLAYER_JOINED' | 'START_GAME' | 'ASSIGN_ROLES' | 'LEAVE_GAME';

interface WebSocketMessage {
  type: MessageType;
  payload: any;
}

class WebSocketService {
  private ws: WebSocket | null = null;
  private listeners: Map<string, ((data: any) => void)[]> = new Map();

  connect(roomCode: string, playerId: string) {
    // In production, this would be your WebSocket server URL
    this.ws = new WebSocket(`ws://localhost:3001?room=${roomCode}&playerId=${playerId}`);

    this.ws.onopen = () => {
      console.log('Connected to WebSocket');
    };

    this.ws.onmessage = (event) => {
      const message: WebSocketMessage = JSON.parse(event.data);
      this.notifyListeners(message.type, message.payload);
    };

    this.ws.onclose = () => {
      console.log('Disconnected from WebSocket');
    };
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  send(type: MessageType, payload: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, payload }));
    }
  }

  on(type: MessageType, callback: (data: any) => void) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, []);
    }
    this.listeners.get(type)?.push(callback);
  }

  private notifyListeners(type: MessageType, data: any) {
    this.listeners.get(type)?.forEach(callback => callback(data));
  }
}

// Create a singleton instance
export const wsService = new WebSocketService(); 