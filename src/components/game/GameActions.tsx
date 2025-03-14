/**
 * Component for handling game actions based on player role
 */
import { useState } from 'react';
import { useMutation } from '@apollo/client';
import { Button } from '@/components/ui/button';
import { mutations } from '@/lib/graphql';
import { logger } from '@/utils/logger';
import type { Player, GameState, GameAction } from '@/types/game';

interface GameActionsProps {
  code: string;
  currentPlayer: Player;
  players: Player[];
  gameState: GameState;
}

export function GameActions({ code, currentPlayer, players, gameState }: GameActionsProps) {
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [performAction] = useMutation(mutations.PERFORM_ACTION);

  const availableActions = getAvailableActions(currentPlayer.role!, gameState.phase);
  const alivePlayers = players.filter(p => p.isAlive && p.id !== currentPlayer.id);

  const handleAction = async (action: GameAction) => {
    if (!selectedPlayer) {
      alert('Please select a player first');
      return;
    }

    try {
      await performAction({
        variables: {
          code,
          playerId: currentPlayer.id,
          action,
          targetId: selectedPlayer
        }
      });
      setSelectedPlayer(null);
    } catch (error) {
      logger.error('Failed to perform action:', error);
      alert('Failed to perform action');
    }
  };

  if (!currentPlayer.isAlive) {
    return (
      <div className="text-center text-gray-500">
        You are dead and cannot perform actions
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Select a Player</h3>
      <div className="grid grid-cols-2 gap-2">
        {alivePlayers.map(player => (
          <Button
            key={player.id}
            variant={selectedPlayer === player.id ? 'default' : 'outline'}
            onClick={() => setSelectedPlayer(player.id)}
            className="w-full"
          >
            {player.name}
          </Button>
        ))}
      </div>

      {selectedPlayer && (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Available Actions</h3>
          <div className="grid grid-cols-2 gap-2">
            {availableActions.map(action => (
              <Button
                key={action}
                onClick={() => handleAction(action)}
                className="w-full"
              >
                {getActionLabel(action)}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Helper function to determine available actions based on role and phase
 */
function getAvailableActions(role: string, phase: GamePhase): GameAction[] {
  if (phase === 'voting') {
    return ['vote'];
  }

  if (phase === 'night') {
    switch (role) {
      case 'mafia':
        return ['kill'];
      case 'detective':
        return ['investigate'];
      case 'doctor':
        return ['protect'];
      default:
        return [];
    }
  }

  return [];
}

/**
 * Helper function to get human-readable action labels
 */
function getActionLabel(action: GameAction): string {
  switch (action) {
    case 'vote':
      return 'Vote to Lynch';
    case 'kill':
      return 'Kill Player';
    case 'investigate':
      return 'Investigate';
    case 'protect':
      return 'Protect';
    default:
      return action;
  }
} 