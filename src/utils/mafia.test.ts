/**
 * Simple test for Mafia game logic
 */
import { MAFIA_SETUPS } from '@/components/game/MafiaSetup';

describe('Mafia Game Logic', () => {
  test('MAFIA_SETUPS should be properly defined', () => {
    expect(MAFIA_SETUPS).toBeDefined();
    expect(Array.isArray(MAFIA_SETUPS)).toBe(true);
    expect(MAFIA_SETUPS.length).toBeGreaterThan(0);
  });

  test('Each setup should have required properties', () => {
    MAFIA_SETUPS.forEach(setup => {
      expect(setup).toHaveProperty('minPlayers');
      expect(setup).toHaveProperty('maxPlayers');
      expect(setup).toHaveProperty('mafia');
      expect(setup).toHaveProperty('detective');
      expect(setup).toHaveProperty('doctor');
    });
  });
}); 