/**
 * Database service layer for game operations
 */
import { GameRoom, IGameRoom, Player, IPlayer } from '@/models/game';
import { logger } from '@/utils/logger';
import type { PlayerRole, GameStatus } from '@/types/game';

export class DatabaseService {
  /**
   * Creates a new game room
   */
  async createRoom(hostName: string): Promise<IGameRoom> {
    try {
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      const room = new GameRoom({
        code,
        hostName,
        players: [],
        status: 'waiting'
      });

      await room.save();
      logger.info(`Created new game room: ${code}`);
      return room;
    } catch (error) {
      logger.error('Failed to create game room:', error);
      throw error;
    }
  }

  /**
   * Retrieves a game room by code
   */
  async getRoom(code: string): Promise<IGameRoom | null> {
    try {
      return await GameRoom.findOne({ code });
    } catch (error) {
      logger.error(`Failed to get game room ${code}:`, error);
      throw error;
    }
  }

  /**
   * Updates a game room's status
   */
  async updateRoomStatus(code: string, status: GameStatus): Promise<IGameRoom | null> {
    try {
      return await GameRoom.findOneAndUpdate(
        { code },
        { status },
        { new: true }
      );
    } catch (error) {
      logger.error(`Failed to update game room ${code} status:`, error);
      throw error;
    }
  }

  /**
   * Adds a new player to a room
   */
  async addPlayer(code: string, playerName: string): Promise<IPlayer | null> {
    try {
      const room = await this.getRoom(code);
      if (!room) return null;

      const newPlayer: IPlayer = new Player({
        id: Math.random().toString(36).substring(2, 15),
        name: playerName
      });

      room.players.push(newPlayer);
      await room.save();
      
      logger.info(`Added player ${playerName} to room ${code}`);
      return newPlayer;
    } catch (error) {
      logger.error(`Failed to add player to room ${code}:`, error);
      throw error;
    }
  }

  /**
   * Updates players in a room
   */
  async updatePlayers(code: string, players: IPlayer[]): Promise<IGameRoom | null> {
    try {
      return await GameRoom.findOneAndUpdate(
        { code },
        { 
          players,
          status: 'started'
        },
        { new: true }
      );
    } catch (error) {
      logger.error(`Failed to update players in room ${code}:`, error);
      throw error;
    }
  }

  /**
   * Deletes a room
   */
  async deleteRoom(code: string): Promise<void> {
    try {
      await GameRoom.deleteOne({ code });
      logger.info(`Deleted room ${code}`);
    } catch (error) {
      logger.error(`Failed to delete room ${code}:`, error);
      throw error;
    }
  }
}

export const dbService = new DatabaseService(); 