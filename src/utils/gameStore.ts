import { pusherClient } from '@/lib/pusher';
import type { Player, GameStatus } from '@/types/game';

interface GameRoom {
  code: string;
  hostName: string;
  players: Player[];
  status: GameStatus;
}

interface RoomSubscription {
  onPlayerJoined?: (player: Player) => void;
  onPlayerLeft?: (playerId: string) => void;
  onGameStarted?: (players: Player[]) => void;
  onGameReset?: () => void;
  onGameEnded?: (data: { reason: string }) => void;
}

const STORAGE_PREFIX = 'mafia_game_';

export const GameStore = {
  subscribeToRoom: (code: string, callbacks: RoomSubscription) => {
    const channel = pusherClient.subscribe(`game-${code}`);

    channel.bind('player-joined', (player: Player) => {
      callbacks.onPlayerJoined?.(player);
    });

    channel.bind('game-started', (players: Player[]) => {
      callbacks.onGameStarted?.(players);
    });

    channel.bind('game-ended', (data: { reason: string }) => {
      callbacks.onGameEnded?.(data);
    });

    return () => {
      channel.unbind_all();
      pusherClient.unsubscribe(`game-${code}`);
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

    localStorage.setItem(`${STORAGE_PREFIX}room_${code}`, JSON.stringify(room));
    localStorage.setItem(`${STORAGE_PREFIX}hostRoom`, code);

    return room;
  },

  getRoom: (code: string): GameRoom | null => {
    const roomData = localStorage.getItem(`${STORAGE_PREFIX}room_${code}`);
    if (!roomData) return null;
    return JSON.parse(roomData);
  },

  validateSession: (code: string, playerId?: string): boolean => {
    const room = GameStore.getRoom(code);
    if (!room) return false;

    if (!playerId) {
      const storedHostRoom = localStorage.getItem(`${STORAGE_PREFIX}hostRoom`);
      return storedHostRoom === code;
    }

    const playerInfo = localStorage.getItem(`${STORAGE_PREFIX}playerInfo`);
    if (!playerInfo) return false;

    const parsedInfo = JSON.parse(playerInfo);
    return parsedInfo.roomCode === code && parsedInfo.id === playerId;
  },

  joinRoom: async (code: string, playerName: string): Promise<Player | null> => {
    const room = GameStore.getRoom(code);
    if (!room) return null;

    const newPlayer: Player = {
      id: Math.random().toString(36).substring(2, 15),
      name: playerName
    };

    room.players.push(newPlayer);
    localStorage.setItem(`${STORAGE_PREFIX}room_${code}`, JSON.stringify(room));

    localStorage.setItem(`${STORAGE_PREFIX}playerInfo`, JSON.stringify({
      id: newPlayer.id,
      name: playerName,
      roomCode: code
    }));

    await fetch('/api/game', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomCode: code,
        event: 'player-joined',
        data: newPlayer
      })
    });

    return newPlayer;
  },

  cleanupRoom: async (code: string) => {
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

  startGame: async (code: string, players: Player[]) => {
    const room = GameStore.getRoom(code);
    if (!room) return;

    room.status = 'in-progress';
    room.players = players;
    localStorage.setItem(`${STORAGE_PREFIX}room_${code}`, JSON.stringify(room));

    await fetch('/api/game', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomCode: code,
        event: 'game-started',
        data: players
      })
    });
  },

  resetGame: async (code: string) => {
    const room = GameStore.getRoom(code);
    if (!room) return;

    room.status = 'waiting';
    room.players = room.players.map(({ id, name }) => ({ id, name }));
    localStorage.setItem(`${STORAGE_PREFIX}room_${code}`, JSON.stringify(room));

    await fetch('/api/game', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomCode: code,
        event: 'game-reset'
      })
    });
  },

  leaveRoom: async (code: string, playerId: string) => {
    const room = GameStore.getRoom(code);
    if (!room) return;

    room.players = room.players.filter(p => p.id !== playerId);
    localStorage.setItem(`${STORAGE_PREFIX}room_${code}`, JSON.stringify(room));

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

  reconnectPlayer: (code: string, playerId: string): Player | null => {
    const room = GameStore.getRoom(code);
    if (!room) return null;
    return room.players.find(p => p.id === playerId) || null;
  }
}; 