/**
 * Basic Test for Role Assignment
 */
import { MAFIA_SETUPS } from '@/components/game/MafiaSetup';

describe('Basic Role Test', () => {
  it('has valid role configurations', () => {
    // Simple test that should always pass
    expect(MAFIA_SETUPS).toBeDefined();
    expect(MAFIA_SETUPS.length).toBeGreaterThan(0);
    
    MAFIA_SETUPS.forEach(setup => {
      expect(setup.minPlayers).toBeGreaterThanOrEqual(6);
      expect(setup.maxPlayers).toBeLessThanOrEqual(15);
      expect(setup.mafia).toBeGreaterThanOrEqual(1);
      expect(setup.detective).toBeGreaterThanOrEqual(1);
      expect(setup.doctor).toBeGreaterThanOrEqual(1);
    });
  });
}); 