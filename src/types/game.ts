import React from 'react';

export type Role = 'Mafia' | 'Detective' | 'Doctor' | 'Villager';
export type GameStatus = 'waiting' | 'in-progress';

export interface Player {
  id: string;
  name: string;
  role?: Role;
}

export interface GameRoom {
  id: string;
  code: string;
  status: GameStatus;
  players: Player[];
  maxPlayers: number;
  hostId: string;
}

export interface GameRole {
  role: Role;
  icon: React.ReactNode;
}

export interface RoleDistribution {
  detectives: number;
  doctors: number;
  mafia: number;
  villagers: number;
}
