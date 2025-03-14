/**
 * Custom hook for game-related GraphQL operations
 * Provides reusable queries and mutations with proper error handling
 */
import { useQuery, useMutation } from '@apollo/client';
import { queries, mutations } from '@/lib/graphql';
import { logger } from '@/utils/logger';

export function useGame() {
  const getRoom = (code: string) => {
    return useQuery(queries.GET_ROOM, {
      variables: { code },
      onError: (error) => {
        logger.error(`Failed to get room ${code}:`, error);
      }
    });
  };

  const validateSession = (code: string, playerId?: string) => {
    return useQuery(queries.VALIDATE_SESSION, {
      variables: { code, playerId },
      onError: (error) => {
        logger.error(`Failed to validate session for room ${code}:`, error);
      }
    });
  };

  const [joinRoom] = useMutation(mutations.JOIN_ROOM, {
    onError: (error) => {
      logger.error('Failed to join room:', error);
    }
  });

  const [startGame] = useMutation(mutations.START_GAME, {
    onError: (error) => {
      logger.error('Failed to start game:', error);
    }
  });

  const [endGame] = useMutation(mutations.END_GAME, {
    onError: (error) => {
      logger.error('Failed to end game:', error);
    }
  });

  return {
    getRoom,
    validateSession,
    joinRoom,
    startGame,
    endGame
  };
} 