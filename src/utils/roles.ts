import type { PlayerRole } from '@/types/game';

export const RoleIcons: Record<PlayerRole, string> = {
  mafia: '🔪',
  detective: '🔍',
  doctor: '💉',
  villager: '🏘️',
  unassigned: '❓'
};

export const RoleColors: Record<PlayerRole, string> = {
  mafia: 'text-red-600',
  detective: 'text-blue-600',
  doctor: 'text-green-600',
  villager: 'text-gray-600',
  unassigned: 'text-gray-400'
};

export const RoleNames: Record<PlayerRole, string> = {
  mafia: 'Mafia',
  detective: 'Detective',
  doctor: 'Doctor',
  villager: 'Villager',
  unassigned: 'Unassigned'
};

export const RoleDescriptions: Record<PlayerRole, string> = {
  mafia: '🔪 "Make them an offer they can\'t refuse"... by eliminating them! Don\'t worry, it\'s just a game... right?',
  detective: '🔍 CSI who? You\'re basically Batman without the cool car. Time to solve some mysteries!',
  doctor: '💉 Grey\'s Anatomy meets Among Us! Save lives at night, try not to get killed during the day. Just another day at the office!',
  villager: '🏘️ No special powers, just vibes and trust issues. Living the paranoid life one accusation at a time!',
  unassigned: '⌛ Plot twist loading... Will you be the hero or the one who "takes care of business"?'
}; 