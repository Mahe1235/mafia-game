import React from 'react';

export type GameStatus = 'waiting' | 'started' | 'ended';
export type PlayerRole = 'mafia' | 'detective' | 'doctor' | 'villager' | 'unassigned';

export interface Player {
  id: string;
  name: string;
  role?: PlayerRole;
  isAlive?: boolean;
}

export interface GameRoom {
  code: string;
  hostName: string;
  players: Player[];
  status: GameStatus;
  minPlayers: number;
  maxPlayers: number;
  roles?: {
    mafia: number;
    detective: number;
    doctor: number;
    civilian: number;
  };
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
