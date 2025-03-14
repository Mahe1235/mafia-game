/**
 * Main game room component with separate views for God and Players
 */
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { pusherClient } from '@/lib/pusher';
import type { GameRoom as GameRoomType, Player } from '@/types/game';
import { logger } from '@/utils/logger';

export function GameRoom() {
  const [room, setRoom] = useState<GameRoomType | null>(null);
  const [isLoading, setLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams?.get('code')?.toUpperCase();

  const isHost = localStorage.getItem('hostRoom') === code;
  const playerSession = sessionStorage.getItem('playerSession');
  const playerData = playerSession ? JSON.parse(playerSession) : null;

  useEffect(() => {
    if (!code) {
      router.replace('/?error=invalid-code');
      return;
    }

    const fetchRoom = async () => {
      try {
        const response = await fetch(`/api/game?code=${code}`);
        if (!response.ok) throw new Error('Room not found');
        const roomData = await response.json();
        setRoom(roomData);
      } catch (error) {
        logger.error('Error fetching room:', error);
        router.replace('/?error=room-not-found');
      } finally {
        setLoading(false);
      }
    };

    fetchRoom();

    // Subscribe to game updates with enhanced error handling
    let channel: any;
    
    try {
      channel = pusherClient.subscribe(`game-${code}`);
      
      // Handle new players joining
      channel.bind('player-joined', (newPlayer: Player) => {
        setRoom(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            players: [...prev.players, newPlayer]
          };
        });
        logger.info(`Player joined: ${newPlayer.name}`);
      });
      
      // Handle game starting with role assignments
      channel.bind('game-started', (players: Player[]) => {
        setRoom(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            status: 'started',
            players
          };
        });
        logger.info('Game started with role assignments');
      });
      
      // Handle player elimination
      channel.bind('player-eliminated', (playerId: string) => {
        setRoom(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            players: prev.players.map(p => 
              p.id === playerId ? { ...p, isAlive: false } : p
            )
          };
        });
        logger.info(`Player eliminated: ${playerId}`);
      });
      
      // Handle player leaving
      channel.bind('player-left', (playerId: string) => {
        setRoom(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            players: prev.players.filter(p => p.id !== playerId)
          };
        });
        logger.info(`Player left: ${playerId}`);
      });

      // Handle game ended/reset
      channel.bind('game-ended', () => {
        logger.info('Game ended, redirecting...');
        router.replace('/');
      });
      
      channel.bind('game-reset', () => {
        fetchRoom(); // Refetch room data on game reset
        logger.info('Game reset, refreshing data');
      });
      
      // Handle connection errors
      pusherClient.connection.bind('error', (err: any) => {
        logger.error('Pusher connection error:', err);
      });
      
      // Handle disconnection
      pusherClient.connection.bind('disconnected', () => {
        logger.warn('Pusher disconnected, attempting to reconnect...');
        // Pusher will automatically attempt to reconnect
      });
      
    } catch (error) {
      logger.error('Error setting up Pusher:', error);
    }

    // Cleanup function - properly handle Pusher cleanup
    return () => {
      try {
        if (channel) {
          channel.unbind_all();
          pusherClient.unsubscribe(`game-${code}`);
        }
        logger.info('Cleaned up Pusher subscriptions');
      } catch (error) {
        logger.error('Error cleaning up Pusher:', error);
      }
    };
  }, [code, router]);

  const handleStartGame = async () => {
    if (!room || room.players.length < room.minPlayers) return;

    try {
      await fetch('/api/game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomCode: code,
          event: 'game-started',
          data: null
        })
      });
    } catch (error) {
      logger.error('Start game error:', error);
    }
  };

  const handleEndGame = async () => {
    try {
      await fetch('/api/game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomCode: code,
          event: 'game-ended',
          data: { reason: 'host-ended' }
        })
      });
      router.replace('/');
    } catch (error) {
      logger.error('End game error:', error);
    }
  };

  const handleEliminatePlayer = async (playerId: string) => {
    try {
      await fetch('/api/game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomCode: code,
          event: 'player-eliminated',
          data: { playerId }
        })
      });
    } catch (error) {
      console.error('Failed to eliminate player:', error);
    }
  };

  if (isLoading) {
    return (
      <Container>
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="text-lg">Loading game...</div>
        </div>
      </Container>
    );
  }

  if (!room) {
    return (
      <Container>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Game not found</h1>
          <Button onClick={() => router.push('/')} className="mt-4">
            Back to Home
          </Button>
        </div>
      </Container>
    );
  }

  const currentPlayer = playerData ? room.players.find(p => p.id === playerData.id) : null;

  const renderPlayer = (player: Player) => {
    const isCurrentPlayer = player.id === currentPlayer?.id;
    const baseClasses = ['p-2', 'rounded-md', 'flex', 'items-center', 'justify-between'];
    const statusClasses = !player.isAlive 
      ? ['bg-red-50', 'text-red-800', 'line-through', 'opacity-75']
      : ['bg-gray-50'];
    
    const playerClasses = [...baseClasses, ...statusClasses].join(' ');

    return (
      <div 
        key={player.id} 
        className={playerClasses}
        data-testid={`player-${player.id}`}
      >
        <span className="flex items-center">
          <span className="mr-2">
            {player.role === 'mafia' && '🔪'}
            {player.role === 'detective' && '🔍'}
            {player.role === 'doctor' && '💉'}
            {player.role === 'villager' && '🏘️'}
          </span>
          <span>
            {player.name}
            {isCurrentPlayer && ' (You)'}
            {!player.isAlive && ' (Dead)'}
          </span>
        </span>
        {isHost && room.status === 'started' && player.isAlive && (
          <button
            onClick={() => handleEliminatePlayer(player.id)}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium 
                     transition-colors focus-visible:outline-none focus-visible:ring-2 
                     focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 
                     disabled:pointer-events-none ring-offset-background border border-input 
                     bg-background hover:bg-accent hover:text-accent-foreground text-red-600 
                     hover:text-red-700 hover:bg-red-50"
          >
            Eliminate
          </button>
        )}
      </div>
    );
  };

  return (
    <Container>
      <div className="space-y-4 sm:space-y-6">
        <div className="text-center space-y-2 sm:space-y-3">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
            {isHost ? 'God View' : 'Player View'}
          </h1>
          <p className="text-gray-600">Room Code: {room.code}</p>
        </div>

        <Card className="shadow-lg mt-6">
          <CardContent className="p-4 sm:p-6">
            <div className="space-y-4">
              {room.status === 'started' && !isHost && currentPlayer && (
                <div className="text-center p-4 bg-blue-50 rounded-md">
                  <h2 className="text-lg font-semibold text-blue-900">
                    <span className="text-2xl mr-2">
                      {currentPlayer.role === 'mafia' && '🔪'}
                      {currentPlayer.role === 'detective' && '🔍'}
                      {currentPlayer.role === 'doctor' && '💉'}
                      {currentPlayer.role === 'villager' && '🏘️'}
                    </span>
                    Your Role: {currentPlayer.role?.charAt(0).toUpperCase() + currentPlayer.role?.slice(1)}
                  </h2>
                </div>
              )}

              <div>
                <h2 className="text-xl font-semibold mb-2">Players</h2>
                <div className="space-y-2">
                  {room?.players?.map(renderPlayer) || <div>No players available</div>}
                </div>
              </div>

              {isHost && (
                <div className="space-y-2 pt-4">
                  {room.status === 'waiting' ? (
                    <Button
                      onClick={handleStartGame}
                      className="w-full"
                      disabled={room.players.length < room.minPlayers}
                    >
                      Start Game
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleStartGame()}
                      variant="outline"
                      className="w-full"
                    >
                      Reassign Roles
                    </Button>
                  )}
                  <Button
                    onClick={handleEndGame}
                    variant="outline"
                    className="w-full"
                  >
                    End Game
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </Container>
  );
} 