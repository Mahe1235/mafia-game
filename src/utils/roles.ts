import type { PlayerRole } from '@/types/game';

export const RoleIcons: Record<PlayerRole, string> = {
  unassigned: '❓',
  mafia: '🔪',
  detective: '🔍',
  doctor: '💉',
  civilian: '👥'
};

export const RoleColors: Record<PlayerRole, string> = {
  unassigned: 'text-gray-500',
  mafia: 'text-red-500',
  detective: 'text-blue-500',
  doctor: 'text-green-500',
  civilian: 'text-yellow-500'
};

export const RoleDescriptions: Record<PlayerRole, string> = {
  unassigned: 'Waiting for role...',
  mafia: 'Eliminate other players without getting caught',
  detective: 'Investigate players to find the mafia',
  doctor: 'Protect players from elimination',
  civilian: 'Work with others to identify the mafia'
}; 