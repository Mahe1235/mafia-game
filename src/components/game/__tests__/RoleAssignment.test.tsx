/**
 * Tests for role assignment and game logic
 */
import { assignRoles } from '@/utils/gameLogic';
import { MAFIA_SETUPS } from '@/components/game/MafiaSetup';
import type { Player } from '@/types/game';

describe('Role Assignment', () => {
  // Helper function to create test players
  const createPlayers = (count: number): Player[] => {
    return Array.from({ length: count }, (_, i) => ({
      id: `player-${i}`,
      name: `Player ${i}`,
      isAlive: true
    }));
  };

  it('assigns the correct number of roles based on player count', () => {
    // Test for each player count defined in the MAFIA_SETUPS
    MAFIA_SETUPS.forEach(setup => {
      // Test the minimum number of players in this setup
      const minPlayers = createPlayers(setup.minPlayers);
      const minPlayersWithRoles = assignRoles(minPlayers);
      
      // Count the roles
      const roleCounts = minPlayersWithRoles.reduce((counts, player) => {
        counts[player.role!] = (counts[player.role!] || 0) + 1;
        return counts;
      }, {} as Record<string, number>);
      
      // Verify role counts match the setup
      expect(roleCounts.mafia).toBe(setup.mafia);
      expect(roleCounts.detective).toBe(setup.detective);
      expect(roleCounts.doctor).toBe(setup.doctor);
      expect(roleCounts.villager).toBe(setup.minPlayers - setup.mafia - setup.detective - setup.doctor);
      
      // Test the maximum number of players for this setup if applicable
      if (setup.maxPlayers !== setup.minPlayers) {
        const maxPlayers = createPlayers(setup.maxPlayers);
        const maxPlayersWithRoles = assignRoles(maxPlayers);
        
        const maxRoleCounts = maxPlayersWithRoles.reduce((counts, player) => {
          counts[player.role!] = (counts[player.role!] || 0) + 1;
          return counts;
        }, {} as Record<string, number>);
        
        expect(maxRoleCounts.mafia).toBe(setup.mafia);
        expect(maxRoleCounts.detective).toBe(setup.detective);
        expect(maxRoleCounts.doctor).toBe(setup.doctor);
        expect(maxRoleCounts.villager).toBe(setup.maxPlayers - setup.mafia - setup.detective - setup.doctor);
      }
    });
  });

  it('ensures all players receive a role when game starts', () => {
    // Test with different player counts
    [6, 9, 12, 15].forEach(playerCount => {
      const players = createPlayers(playerCount);
      const playersWithRoles = assignRoles(players);
      
      // Verify every player has a role assigned
      playersWithRoles.forEach(player => {
        expect(player.role).toBeDefined();
        expect(['mafia', 'detective', 'doctor', 'villager']).toContain(player.role);
      });
    });
  });

  it('assigns different roles each time (randomness test)', () => {
    // Create 10 players
    const players = createPlayers(10);
    
    // Run role assignment multiple times
    const assignment1 = assignRoles([...players]);
    const assignment2 = assignRoles([...players]);
    
    // Extract just the roles in order
    const roles1 = assignment1.map(p => p.role);
    const roles2 = assignment2.map(p => p.role);
    
    // The probability of getting the exact same assignment twice is very low
    // Note: This test could occasionally fail due to pure chance
    expect(roles1).not.toEqual(roles2);
  });

  it('handles invalid player counts gracefully', () => {
    // Test with too few players
    const tooFewPlayers = createPlayers(3);
    expect(() => assignRoles(tooFewPlayers)).toThrow();
    
    // Test with too many players
    const tooManyPlayers = createPlayers(20);
    expect(() => assignRoles(tooManyPlayers)).toThrow();
  });
}); 