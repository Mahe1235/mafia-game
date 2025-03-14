import React from 'react';

/**
 * Game-related type definitions
 */
export type GameStatus = 'waiting' | 'started' | 'ended';
export type PlayerRole = 'mafia' | 'detective' | 'doctor' | 'villager' | 'unassigned';
export type GamePhase = 'day' | 'night' | 'voting';
export type GameAction = 'vote' | 'investigate' | 'protect' | 'kill';

export interface Player {
  id: string;
  name: string;
  role?: PlayerRole;
  isAlive: boolean;
  isProtected?: boolean;
}

export interface GameState {
  phase: GamePhase;
  round: number;
  timeLeft: number;
  votes: Record<string, string>;  // playerId -> targetId
  actions: Record<string, GameAction>;
  lastKilled?: string;
  lastSaved?: string;
  lastInvestigated?: string;
}

export interface GameRoom {
  code: string;
  hostName: string;
  players: Player[];
  status: GameStatus;
  minPlayers: number;
  maxPlayers: number;
  gameState?: GameState;
  roles?: {
    mafia: number;
    detective: number;
    doctor: number;
    civilian: number;
  };
  winner?: 'mafia' | 'villagers';
}

export interface PlayerSession {
  id: string;
  name: string;
  roomCode: string;
  role?: PlayerRole;
}

export interface GameRole {
  role: PlayerRole;
  icon: React.ReactNode;
}

export interface RoleDistribution {
  detectives: number;
  doctors: number;
  mafia: number;
  villagers: number;
}
