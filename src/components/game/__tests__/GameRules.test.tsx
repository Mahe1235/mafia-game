/**
 * Tests for game rules and win conditions
 */
import { checkWinCondition, validatePlayerCount, validateRoleDistribution } from '@/utils/gameLogic';
import type { Player, GameRoom } from '@/types/game';

describe('Game Rules & Win Conditions', () => {
  // Helper function to create test players
  const createPlayers = (mafiaCount: number, villagerCount: number, allAlive = true): Player[] => {
    const players: Player[] = [];
    
    // Create mafia players
    for (let i = 0; i < mafiaCount; i++) {
      players.push({
        id: `mafia-${i}`,
        name: `Mafia ${i}`,
        role: 'mafia',
        isAlive: allAlive
      });
    }
    
    // Create villager players (including detectives and doctors)
    for (let i = 0; i < villagerCount; i++) {
      const role = i === 0 ? 'detective' : i === 1 ? 'doctor' : 'villager';
      players.push({
        id: `villager-${i}`,
        name: `Villager ${i}`,
        role,
        isAlive: allAlive
      });
    }
    
    return players;
  };

  it('detects mafia win when all villagers are eliminated', () => {
    const players = [
      // Living mafia
      { id: '1', name: 'Player 1', role: 'mafia', isAlive: true },
      { id: '2', name: 'Player 2', role: 'mafia', isAlive: true },
      // Dead villagers
      { id: '3', name: 'Player 3', role: 'detective', isAlive: false },
      { id: '4', name: 'Player 4', role: 'doctor', isAlive: false },
      { id: '5', name: 'Player 5', role: 'villager', isAlive: false },
      { id: '6', name: 'Player 6', role: 'villager', isAlive: false },
    ];
    
    const result = checkWinCondition(players);
    expect(result.gameOver).toBe(true);
    expect(result.winner).toBe('mafia');
  });

  it('detects villager win when all mafia are eliminated', () => {
    const players = [
      // Dead mafia
      { id: '1', name: 'Player 1', role: 'mafia', isAlive: false },
      { id: '2', name: 'Player 2', role: 'mafia', isAlive: false },
      // Living villagers
      { id: '3', name: 'Player 3', role: 'detective', isAlive: true },
      { id: '4', name: 'Player 4', role: 'doctor', isAlive: true },
      { id: '5', name: 'Player 5', role: 'villager', isAlive: true },
      { id: '6', name: 'Player 6', role: 'villager', isAlive: true },
    ];
    
    const result = checkWinCondition(players);
    expect(result.gameOver).toBe(true);
    expect(result.winner).toBe('villagers');
  });

  it('detects ongoing game when both teams still have members', () => {
    const players = [
      // Mixed mafia
      { id: '1', name: 'Player 1', role: 'mafia', isAlive: true },
      { id: '2', name: 'Player 2', role: 'mafia', isAlive: false },
      // Mixed villagers
      { id: '3', name: 'Player 3', role: 'detective', isAlive: false },
      { id: '4', name: 'Player 4', role: 'doctor', isAlive: true },
      { id: '5', name: 'Player 5', role: 'villager', isAlive: true },
      { id: '6', name: 'Player 6', role: 'villager', isAlive: false },
    ];
    
    const result = checkWinCondition(players);
    expect(result.gameOver).toBe(false);
    expect(result.winner).toBe(null);
  });

  it('detects mafia win when mafia equals villagers in numbers', () => {
    const players = [
      // Living mafia
      { id: '1', name: 'Player 1', role: 'mafia', isAlive: true },
      { id: '2', name: 'Player 2', role: 'mafia', isAlive: true },
      // Living villagers (equal number to mafia)
      { id: '3', name: 'Player 3', role: 'detective', isAlive: true },
      { id: '4', name: 'Player 4', role: 'doctor', isAlive: true },
      // Dead villagers
      { id: '5', name: 'Player 5', role: 'villager', isAlive: false },
      { id: '6', name: 'Player 6', role: 'villager', isAlive: false },
    ];
    
    const result = checkWinCondition(players);
    expect(result.gameOver).toBe(true);
    expect(result.winner).toBe('mafia');
  });

  it('enforces minimum player requirements', () => {
    const minPlayers = 6;
    
    // Test with too few players
    const players = createPlayers(2, 3); // 5 players total
    expect(() => validatePlayerCount(players, minPlayers)).toThrow();
    
    // Test with exactly minimum players
    const validPlayers = createPlayers(2, 4); // 6 players total
    expect(() => validatePlayerCount(validPlayers, minPlayers)).not.toThrow();
  });

  it('validates proper role distribution', () => {
    // Valid role distribution
    const validPlayers = [
      { id: '1', name: 'Player 1', role: 'mafia', isAlive: true },
      { id: '2', name: 'Player 2', role: 'mafia', isAlive: true },
      { id: '3', name: 'Player 3', role: 'detective', isAlive: true },
      { id: '4', name: 'Player 4', role: 'doctor', isAlive: true },
      { id: '5', name: 'Player 5', role: 'villager', isAlive: true },
      { id: '6', name: 'Player 6', role: 'villager', isAlive: true },
    ];
    expect(() => validateRoleDistribution(validPlayers)).not.toThrow();
    
    // Invalid - too many mafia
    const tooManyMafia = [
      { id: '1', name: 'Player 1', role: 'mafia', isAlive: true },
      { id: '2', name: 'Player 2', role: 'mafia', isAlive: true },
      { id: '3', name: 'Player 3', role: 'mafia', isAlive: true },
      { id: '4', name: 'Player 4', role: 'mafia', isAlive: true },
      { id: '5', name: 'Player 5', role: 'villager', isAlive: true },
      { id: '6', name: 'Player 6', role: 'villager', isAlive: true },
    ];
    expect(() => validateRoleDistribution(tooManyMafia)).toThrow();
    
    // Invalid - missing key roles
    const missingRoles = [
      { id: '1', name: 'Player 1', role: 'mafia', isAlive: true },
      { id: '2', name: 'Player 2', role: 'mafia', isAlive: true },
      { id: '3', name: 'Player 3', role: 'villager', isAlive: true },
      { id: '4', name: 'Player 4', role: 'villager', isAlive: true },
      { id: '5', name: 'Player 5', role: 'villager', isAlive: true },
      { id: '6', name: 'Player 6', role: 'villager', isAlive: true },
    ];
    expect(() => validateRoleDistribution(missingRoles)).toThrow();
  });
}); 