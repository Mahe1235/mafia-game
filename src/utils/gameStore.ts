import { pusherClient } from '@/lib/pusher';
import type { Player, GameStatus } from '@/types/game';

interface GameRoom {
  code: string;
  hostName: string;
  players: Player[];
  status: GameStatus;
}

const STORAGE_PREFIX = 'mafia_game_';

interface RoomSubscription {
  onPlayerJoined?: (player: Player) => void;
  onPlayerLeft?: (playerId: string) => void;
  onGameStarted?: (players: Player[]) => void;
  onGameReset?: () => void;
  onGameEnded?: (data: { reason: string }) => void;
}

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

    // Create room via API
    const response = await fetch('/api/game', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomCode: code,
        event: 'room-created',
        data: room
      })
    });

    if (!response.ok) {
      throw new Error('Failed to create room');
    }

    // Store host session
    localStorage.setItem(`${STORAGE_PREFIX}hostRoom`, code);
    console.log('Room created:', room);
    return room;
  },

  getRoom: async (code: string): Promise<GameRoom | null> => {
    console.log('Getting room:', code);
    
    try {
      const response = await fetch(`/api/game?code=${code}`);
      if (!response.ok) {
        console.log('Room not found via API');
        return null;
      }
      
      const room = await response.json();
      console.log('Room data found:', room);
      return room;
    } catch (error) {
      console.error('Error getting room:', error);
      return null;
    }
  },

  validateSession: async (code: string, playerId?: string): Promise<boolean> => {
    console.log('Validating session:', { code, playerId });
    const room = await GameStore.getRoom(code);
    
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
      const room = await GameStore.getRoom(code);
      console.log('Found room:', room);
      
      if (!room) {
        console.error('Room not found:', code);
        return null;
      }

      const newPlayer: Player = {
        id: Math.random().toString(36).substring(2, 15),
        name: playerName
        // role will be assigned when game starts
      };

      // Store player info locally
      const playerInfo = {
        id: newPlayer.id,
        name: playerName,
        roomCode: code
      };
      localStorage.setItem(`${STORAGE_PREFIX}playerInfo`, JSON.stringify(playerInfo));
      console.log('Stored player info:', playerInfo);

      // Join room via API
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
        throw new Error('Failed to join room');
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
    
    await fetch('/api/game', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomCode: code,
        event: 'game-ended',
        data: { reason: 'host-left' }
      })
    });

    localStorage.removeItem(`${STORAGE_PREFIX}hostRoom`);
    localStorage.removeItem(`${STORAGE_PREFIX}playerInfo`);
    console.log('Room cleaned up');
  },

  startGame: async (code: string, players: Player[]) => {
    const room = await GameStore.getRoom(code);
    if (!room) return;

    room.status = 'started';
    room.players = players;

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
    const room = await GameStore.getRoom(code);
    if (!room) return;

    room.status = 'waiting';
    room.players = room.players.map(({ id, name }) => ({ id, name }));

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
    const room = await GameStore.getRoom(code);
    if (!room) return;

    room.players = room.players.filter(p => p.id !== playerId);

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

  reconnectPlayer: async (code: string, playerId: string): Promise<Player | null> => {
    const room = await GameStore.getRoom(code);
    if (!room) return null;
    return room.players.find(p => p.id === playerId) || null;
  }
}; 