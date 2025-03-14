import { assignRoles, checkWinCondition, validatePlayerCount, validateRoleDistribution } from './gameLogic';
import { MAFIA_SETUPS } from '@/components/game/MafiaSetup';
import type { Player } from '@/types/game';

describe('Game Logic', () => {
  // Helper function to create test players
  const createPlayers = (count: number): Player[] => {
    return Array.from({ length: count }, (_, i) => ({
      id: `player-${i}`,
      name: `Player ${i}`,
      isAlive: true
    }));
  };
  
  describe('Role Assignment', () => {
    it('assigns the correct number of roles based on player count', () => {
      // Test with minimal player count from first setup
      const minSetup = MAFIA_SETUPS[0];
      const players = createPlayers(minSetup.minPlayers);
      
      const playersWithRoles = assignRoles(players);
      
      // Count roles
      const counts = playersWithRoles.reduce((acc, player) => {
        acc[player.role!] = (acc[player.role!] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      expect(counts.mafia).toBe(minSetup.mafia);
      expect(counts.detective).toBe(minSetup.detective);
      expect(counts.doctor).toBe(minSetup.doctor);
    });
    
    it('throws error for invalid player counts', () => {
      const tooFewPlayers = createPlayers(3);
      expect(() => assignRoles(tooFewPlayers)).toThrow();
      
      const tooManyPlayers = createPlayers(20);
      expect(() => assignRoles(tooManyPlayers)).toThrow();
    });
  });
  
  describe('Win Conditions', () => {
    it('detects mafia win when all villagers are eliminated', () => {
      const players = [
        { id: '1', name: 'Mafia 1', role: 'mafia', isAlive: true },
        { id: '2', name: 'Mafia 2', role: 'mafia', isAlive: true },
        { id: '3', name: 'Villager 1', role: 'villager', isAlive: false },
        { id: '4', name: 'Villager 2', role: 'detective', isAlive: false }
      ];
      
      const result = checkWinCondition(players);
      expect(result.gameOver).toBe(true);
      expect(result.winner).toBe('mafia');
    });
    
    it('detects villager win when all mafia are eliminated', () => {
      const players = [
        { id: '1', name: 'Mafia 1', role: 'mafia', isAlive: false },
        { id: '2', name: 'Mafia 2', role: 'mafia', isAlive: false },
        { id: '3', name: 'Villager 1', role: 'villager', isAlive: true },
        { id: '4', name: 'Villager 2', role: 'detective', isAlive: true }
      ];
      
      const result = checkWinCondition(players);
      expect(result.gameOver).toBe(true);
      expect(result.winner).toBe('villagers');
    });
    
    it('detects game in progress when both sides have living players', () => {
      const players = [
        { id: '1', name: 'Mafia 1', role: 'mafia', isAlive: true },
        { id: '2', name: 'Mafia 2', role: 'mafia', isAlive: false },
        { id: '3', name: 'Villager 1', role: 'villager', isAlive: true },
        { id: '4', name: 'Villager 2', role: 'detective', isAlive: true }
      ];
      
      const result = checkWinCondition(players);
      expect(result.gameOver).toBe(false);
      expect(result.winner).toBe(null);
    });
  });
  
  describe('Validation Functions', () => {
    it('validates player count correctly', () => {
      expect(() => validatePlayerCount(createPlayers(5), 6)).toThrow();
      expect(() => validatePlayerCount(createPlayers(6), 6)).not.toThrow();
    });
    
    it('validates role distribution', () => {
      const validPlayers = [
        { id: '1', name: 'Player 1', role: 'mafia', isAlive: true },
        { id: '2', name: 'Player 2', role: 'mafia', isAlive: true },
        { id: '3', name: 'Player 3', role: 'detective', isAlive: true },
        { id: '4', name: 'Player 4', role: 'doctor', isAlive: true },
        { id: '5', name: 'Player 5', role: 'villager', isAlive: true },
        { id: '6', name: 'Player 6', role: 'villager', isAlive: true },
      ];
      
      expect(() => validateRoleDistribution(validPlayers)).not.toThrow();
      
      const tooManyMafia = [
        { id: '1', name: 'Player 1', role: 'mafia', isAlive: true },
        { id: '2', name: 'Player 2', role: 'mafia', isAlive: true },
        { id: '3', name: 'Player 3', role: 'mafia', isAlive: true },
        { id: '4', name: 'Player 4', role: 'mafia', isAlive: true },
        { id: '5', name: 'Player 5', role: 'villager', isAlive: true },
        { id: '6', name: 'Player 6', role: 'villager', isAlive: true },
      ];
      
      expect(() => validateRoleDistribution(tooManyMafia)).toThrow();
    });
  });
}); 