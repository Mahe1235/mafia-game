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
    console.log('Subscribing to room:', code);
    const channel = pusherClient.subscribe(`game-${code}`);

    if (callbacks.onPlayerJoined) channel.bind('player-joined', callbacks.onPlayerJoined);
    if (callbacks.onPlayerLeft) channel.bind('player-left', callbacks.onPlayerLeft);
    if (callbacks.onGameStarted) channel.bind('game-started', callbacks.onGameStarted);
    if (callbacks.onGameReset) channel.bind('game-reset', callbacks.onGameReset);
    if (callbacks.onGameEnded) channel.bind('game-ended', callbacks.onGameEnded);

    return () => {
      channel.unbind_all();
      pusherClient.unsubscribe(`game-${code}`);
    };
  },

  createRoom: async (hostName: string): Promise<GameRoom> => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    console.log('Creating room:', code);
    
    const room: GameRoom = {
      code,
      hostName,
      players: [],
      status: 'waiting'
    };

    // Store room data
    const roomKey = `${STORAGE_PREFIX}room_${code}`;
    localStorage.setItem(roomKey, JSON.stringify(room));
    localStorage.setItem(`${STORAGE_PREFIX}hostRoom`, code);

    console.log('Room created:', room);
    console.log('Storage keys:', Object.keys(localStorage));
    return room;
  },

  getRoom: (code: string): GameRoom | null => {
    const roomKey = `${STORAGE_PREFIX}room_${code}`;
    console.log('Getting room:', code);
    console.log('Storage keys:', Object.keys(localStorage));
    
    const roomData = localStorage.getItem(roomKey);
    console.log('Room data found:', roomData);
    
    if (!roomData) return null;
    return JSON.parse(roomData);
  },

  validateSession: (code: string, playerId?: string): boolean => {
    console.log('Validating session:', { code, playerId });
    const room = GameStore.getRoom(code);
    
    if (!room) {
      console.log('Room not found during validation');
      return false;
    }

    if (!playerId) {
      const storedHostRoom = localStorage.getItem(`${STORAGE_PREFIX}hostRoom`);
      console.log('Host validation:', { storedHostRoom, code });
      return storedHostRoom === code;
    }

    const playerInfo = localStorage.getItem(`${STORAGE_PREFIX}playerInfo`);
    console.log('Player validation:', { playerInfo });
    
    if (!playerInfo) return false;

    const parsedInfo = JSON.parse(playerInfo);
    return parsedInfo.roomCode === code && parsedInfo.id === playerId;
  },

  joinRoom: async (code: string, playerName: string): Promise<Player | null> => {
    console.log('Joining room:', { code, playerName });
    
    try {
      const room = GameStore.getRoom(code);
      console.log('Found room:', room);
      
      if (!room) {
        console.error('Room not found:', code);
        return null;
      }

      const newPlayer: Player = {
        id: Math.random().toString(36).substring(2, 15),
        name: playerName
      };

      // Store player info
      const playerInfo = {
        id: newPlayer.id,
        name: playerName,
        roomCode: code
      };
      localStorage.setItem(`${STORAGE_PREFIX}playerInfo`, JSON.stringify(playerInfo));
      console.log('Stored player info:', playerInfo);

      // Update room
      room.players.push(newPlayer);
      localStorage.setItem(`${STORAGE_PREFIX}room_${code}`, JSON.stringify(room));
      console.log('Updated room:', room);

      // Notify others
      const response = await fetch('/api/game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomCode: code,
          event: 'player-joined',
          data: newPlayer
        })
      });

      if (!response.ok) {
        throw new Error('Failed to notify other players');
      }

      console.log('Successfully joined room');
      return newPlayer;
    } catch (error) {
      console.error('Join room error:', error);
      return null;
    }
  },

  cleanupRoom: async (code: string) => {
    console.log('Cleaning up room:', code);
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
    console.log('Room cleaned up');
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