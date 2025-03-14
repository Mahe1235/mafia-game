/**
 * MongoDB schemas for the game entities
 */
import mongoose, { Schema, Document } from 'mongoose';
import { PlayerRole, GameStatus } from '@/types/game';

// Player Schema
export interface IPlayer extends Document {
  id: string;
  name: string;
  role?: PlayerRole;
  isAlive?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PlayerSchema = new Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['mafia', 'detective', 'doctor', 'villager', 'unassigned'],
    default: 'unassigned'
  },
  isAlive: { type: Boolean, default: true }
}, {
  timestamps: true
});

// Game Room Schema
export interface IGameRoom extends Document {
  code: string;
  hostName: string;
  players: IPlayer[];
  status: GameStatus;
  minPlayers: number;
  maxPlayers: number;
  roles?: {
    mafia: number;
    detective: number;
    doctor: number;
    civilian: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const GameRoomSchema = new Schema({
  code: { type: String, required: true, unique: true },
  hostName: { type: String, required: true },
  players: [PlayerSchema],
  status: { 
    type: String, 
    enum: ['waiting', 'started', 'ended'],
    default: 'waiting'
  },
  minPlayers: { type: Number, default: 6 },
  maxPlayers: { type: Number, default: 15 },
  roles: {
    mafia: { type: Number, default: 2 },
    detective: { type: Number, default: 1 },
    doctor: { type: Number, default: 1 },
    civilian: { type: Number, default: 2 }
  }
}, {
  timestamps: true
});

// Create indexes
GameRoomSchema.index({ code: 1 });
PlayerSchema.index({ id: 1 });

export const Player = mongoose.model<IPlayer>('Player', PlayerSchema);
export const GameRoom = mongoose.model<IGameRoom>('GameRoom', GameRoomSchema); 