/**
 * Game logic functions for Mafia game
 */
import { MAFIA_SETUPS } from '@/components/game/MafiaSetup';
import type { Player, PlayerRole } from '@/types/game';

/**
 * Assigns roles to players based on the number of players
 * @param players List of players without roles
 * @returns The same players with roles assigned
 */
export function assignRoles(players: Player[]): Player[] {
  const playerCount = players.length;
  
  // Find the appropriate setup for the player count
  const setup = MAFIA_SETUPS.find(s => 
    playerCount >= s.minPlayers && playerCount <= s.maxPlayers
  );
  
  if (!setup) {
    throw new Error(`Invalid player count: ${playerCount}. Must be between 6 and 15 players.`);
  }

  const roles: PlayerRole[] = [];
  
  // Add roles based on setup
  for (let i = 0; i < setup.mafia; i++) {
    roles.push('mafia');
  }
  
  for (let i = 0; i < setup.detective; i++) {
    roles.push('detective');
  }
  
  for (let i = 0; i < setup.doctor; i++) {
    roles.push('doctor');
  }
  
  // Fill remaining slots with villagers
  while (roles.length < playerCount) {
    roles.push('villager');
  }

  // Shuffle roles using Fisher-Yates algorithm
  for (let i = roles.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [roles[i], roles[j]] = [roles[j], roles[i]];
  }

  // Assign roles to players
  return players.map((player, index) => ({
    ...player,
    role: roles[index],
    isAlive: true
  }));
}

/**
 * Check if the game is over and determine the winner
 * @param players Current players in the game
 * @returns Object indicating if game is over and who won
 */
export function checkWinCondition(players: Player[]): { gameOver: boolean; winner: 'mafia' | 'villagers' | null } {
  // Count living players by role
  const livingMafia = players.filter(p => p.role === 'mafia' && p.isAlive).length;
  const livingVillagers = players.filter(p => p.role !== 'mafia' && p.isAlive).length;
  
  // Mafia wins if all villagers are dead or if mafia equals/outnumbers villagers
  if (livingVillagers === 0 || livingMafia >= livingVillagers) {
    return { gameOver: true, winner: 'mafia' };
  }
  
  // Villagers win if all mafia are dead
  if (livingMafia === 0) {
    return { gameOver: true, winner: 'villagers' };
  }
  
  // Game continues
  return { gameOver: false, winner: null };
}

/**
 * Validates that the player count meets minimum requirements
 * @param players List of players
 * @param minPlayers Minimum players required
 */
export function validatePlayerCount(players: Player[], minPlayers: number): void {
  if (players.length < minPlayers) {
    throw new Error(`Need at least ${minPlayers} players to start the game`);
  }
}

/**
 * Validates that the role distribution is balanced
 * @param players List of players with assigned roles
 */
export function validateRoleDistribution(players: Player[]): void {
  const roles = players.map(p => p.role);
  const mafiaCount = roles.filter(r => r === 'mafia').length;
  const detectiveCount = roles.filter(r => r === 'detective').length;
  const doctorCount = roles.filter(r => r === 'doctor').length;
  
  // Validate mafia count (should be ~25% of players)
  if (mafiaCount > Math.ceil(players.length / 3)) {
    throw new Error('Too many mafia players');
  }
  
  // Validate presence of key roles
  if (detectiveCount < 1) {
    throw new Error('Game must have at least one detective');
  }
  
  if (doctorCount < 1) {
    throw new Error('Game must have at least one doctor');
  }
} 