/**
 * GraphQL resolvers implementation
 */
import { dbService } from '@/services/db';
import { pusher } from '@/lib/pusher';
import { logger } from '@/utils/logger';
import { assignRoles } from '@/utils/gameUtils';
import type { IGameRoom, IPlayer } from '@/models/game';

export const resolvers = {
  Query: {
    getRoom: async (_: any, { code }: { code: string }): Promise<IGameRoom | null> => {
      try {
        return await dbService.getRoom(code);
      } catch (error) {
        logger.error(`Failed to get room ${code}:`, error);
        throw error;
      }
    },

    validateSession: async (_: any, { code, playerId }: { code: string; playerId?: string }): Promise<boolean> => {
      try {
        const room = await dbService.getRoom(code);
        if (!room) return false;
        
        if (!playerId) return true; // Host validation
        return room.players.some(p => p.id === playerId);
      } catch (error) {
        logger.error(`Failed to validate session for room ${code}:`, error);
        throw error;
      }
    }
  },

  Mutation: {
    createRoom: async (_: any, { hostName }: { hostName: string }): Promise<IGameRoom> => {
      try {
        return await dbService.createRoom(hostName);
      } catch (error) {
        logger.error('Failed to create room:', error);
        throw error;
      }
    },

    joinRoom: async (_: any, { code, playerName }: { code: string; playerName: string }): Promise<IPlayer | null> => {
      try {
        const room = await dbService.getRoom(code);
        if (!room || room.status !== 'waiting') return null;

        const player = await dbService.addPlayer(code, playerName);
        if (player) {
          await pusher.trigger(`game-${code}`, 'player-joined', player);
        }
        return player;
      } catch (error) {
        logger.error(`Failed to join room ${code}:`, error);
        throw error;
      }
    },

    startGame: async (_: any, { code }: { code: string }): Promise<boolean> => {
      try {
        const room = await dbService.getRoom(code);
        if (!room || room.players.length < room.minPlayers) return false;

        const playersWithRoles = assignRoles(room.players);
        const updatedRoom = await dbService.updatePlayers(code, playersWithRoles);
        
        if (updatedRoom) {
          await pusher.trigger(`game-${code}`, 'game-started', playersWithRoles);
          return true;
        }
        return false;
      } catch (error) {
        logger.error(`Failed to start game ${code}:`, error);
        throw error;
      }
    },

    endGame: async (_: any, { code, reason }: { code: string; reason: string }): Promise<boolean> => {
      try {
        await pusher.trigger(`game-${code}`, 'game-ended', { reason });
        await dbService.deleteRoom(code);
        return true;
      } catch (error) {
        logger.error(`Failed to end game ${code}:`, error);
        throw error;
      }
    }
  }
}; 