import { pusherClient } from '@/lib/pusher';
import type { Player, GameStatus } from '@/types/game';

interface GameRoom {
  code: string;
  hostName: string;
  players: Player[];
  status: GameStatus;
}

type GameEndReason = 'host-left' | 'game-over';

interface RoomSubscription {
  onPlayerJoin?: (player: Player) => void;
  onPlayerLeave?: (playerId: string) => void;
  onGameStart?: (players: Player[]) => void;
  onGameReset?: () => void;
  onGameEnded?: (data: { reason: GameEndReason }) => void;
}

const STORAGE_PREFIX = 'mafia_game_';

export const GameStore = {
  subscribeToRoom: (roomCode: string, callbacks: RoomSubscription) => {
    const channel = pusher.subscribe(`game-${roomCode}`);
    
    if (callbacks.onPlayerJoin) channel.bind('player-joined', callbacks.onPlayerJoin);
    if (callbacks.onPlayerLeave) channel.bind('player-left', callbacks.onPlayerLeave);
    if (callbacks.onGameStart) channel.bind('game-started', callbacks.onGameStart);
    if (callbacks.onGameReset) channel.bind('game-reset', callbacks.onGameReset);
    if (callbacks.onGameEnded) channel.bind('game-ended', callbacks.onGameEnded);

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(`game-${roomCode}`);
    };
  },

  createRoom: async (hostName: string): Promise<GameRoom> => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const room: GameRoom = {
      code,
      hostName,
      players: [],
      status: 'waiting'
    };

    // Store with prefix
    localStorage.setItem(`${STORAGE_PREFIX}room_${code}`, JSON.stringify(room));
    localStorage.setItem(`${STORAGE_PREFIX}hostRoom`, code);

    return room;
  },

  handleApiResponse: async (response: Response) => {
    if (response.status === 429) {
      throw new Error('Too many requests. Please wait a moment.');
    }
    if (!response.ok) {
      throw new Error('Failed to communicate with the game server.');
    }
    return response.json();
  },

  joinRoom: async (code: string, playerName: string): Promise<Player | null> => {
    const room = GameStore.getRoom(code);
    if (!room) return null;
    
    if (room.players.some(p => p.name === playerName)) return null;

    const newPlayer: Player = {
      id: Math.random().toString(36).substring(2, 15),
      name: playerName
    };

    room.players.push(newPlayer);
    localStorage.setItem(`${STORAGE_PREFIX}room_${code}`, JSON.stringify(room));

    // Store player info
    localStorage.setItem(`${STORAGE_PREFIX}playerInfo`, JSON.stringify({
      id: newPlayer.id,
      name: playerName,
      roomCode: code
    }));

    try {
      const response = await fetch('/api/game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomCode: code,
          event: 'player-joined',
          data: newPlayer
        })
      });

      await GameStore.handleApiResponse(response);
      return newPlayer;
    } catch (error) {
      console.error('Join room error:', error);
      alert(error instanceof Error ? error.message : 'Failed to join room');
      return null;
    }
  },

  startGame: async (code: string, players: Player[]) => {
    const room = GameStore.getRoom(code);
    if (!room) return;

    room.players = players;
    room.status = 'in-progress';
    localStorage.setItem(`${STORAGE_PREFIX}room_${code}`, JSON.stringify(room));

    try {
      const response = await fetch('/api/game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomCode: code,
          event: 'game-started',
          data: players
        })
      });

      await GameStore.handleApiResponse(response);
    } catch (error) {
      console.error('Start game error:', error);
      alert(error instanceof Error ? error.message : 'Failed to start game');
    }
  },

  resetGame: async (code: string) => {
    const room = GameStore.getRoom(code);
    if (!room) return;

    room.status = 'waiting';
    room.players = room.players.map(({ id, name }) => ({ id, name }));
    localStorage.setItem(`${STORAGE_PREFIX}room_${code}`, JSON.stringify(room));

    // Notify all players about game reset
    await fetch('/api/game', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomCode: code,
        event: 'game-reset',
        data: null
      })
    });
  },

  getRoom: (code: string): GameRoom | null => {
    const roomData = localStorage.getItem(`${STORAGE_PREFIX}room_${code}`);
    if (!roomData) return null;
    return JSON.parse(roomData);
  },

  leaveRoom: async (code: string, playerId: string) => {
    const room = GameStore.getRoom(code);
    if (!room) return;

    room.players = room.players.filter(p => p.id !== playerId);
    if (room.players.length === 0) {
      localStorage.removeItem(`${STORAGE_PREFIX}room_${code}`);
    } else {
      localStorage.setItem(`${STORAGE_PREFIX}room_${code}`, JSON.stringify(room));
    }

    // Notify others about player leaving
    await fetch('/api/game', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomCode: code,
        event: 'player-left',
        data: playerId
      })
    });
  },

  cleanupRoom: async (code: string) => {
    // Remove with prefix
    localStorage.removeItem(`${STORAGE_PREFIX}room_${code}`);
    localStorage.removeItem(`${STORAGE_PREFIX}hostRoom`);
    localStorage.removeItem(`${STORAGE_PREFIX}playerInfo`);

    await fetch('/api/game', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomCode: code,
        event: 'game-ended',
        data: { reason: 'host-left' }
      })
    });
  },

  validateSession: (code: string, playerId?: string): boolean => {
    const room = GameStore.getRoom(code);
    if (!room) return false;

    // For host validation
    if (!playerId) {
      const storedHostRoom = localStorage.getItem(`${STORAGE_PREFIX}hostRoom`);
      return storedHostRoom === code;
    }

    // For player validation
    const playerInfo = localStorage.getItem(`${STORAGE_PREFIX}playerInfo`);
    if (!playerInfo) return false;

    const parsedInfo = JSON.parse(playerInfo);
    return parsedInfo.roomCode === code && parsedInfo.id === playerId;
  },

  reconnectPlayer: (code: string, playerId: string): Player | null => {
    const room = GameStore.getRoom(code);
    if (!room) return null;

    const player = room.players.find(p => p.id === playerId);
    if (!player) return null;

    return player;
  }
}; 