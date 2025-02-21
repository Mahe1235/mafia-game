'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Container } from '@/components/ui/container';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { pusherClient } from '@/lib/pusher';
import type { GameRoom, Player } from '@/types/game';

function HostPageContent() {
  const [room, setRoom] = useState<GameRoom | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get('code')?.toUpperCase();

  useEffect(() => {
    if (!code) {
      router.replace('/?error=invalid-code');
      return;
    }

    // Initial room fetch
    const fetchRoom = async () => {
      try {
        const response = await fetch(`/api/game?code=${code}`);
        if (!response.ok) {
          throw new Error('Room not found');
        }
        const roomData = await response.json();
        setRoom(roomData);
      } catch (error) {
        console.error('Error fetching room:', error);
        router.replace('/?error=room-not-found');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRoom();

    // Subscribe to room updates
    const channel = pusherClient.subscribe(`game-${code}`);
    
    channel.bind('player-joined', (player: Player) => {
      setRoom(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          players: [...prev.players, player]
        };
      });
    });

    channel.bind('game-started', (players: Player[]) => {
      setRoom(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          status: 'started',
          players
        };
      });
    });

    return () => {
      channel.unbind_all();
      pusherClient.unsubscribe(`game-${code}`);
    };
  }, [code, router]);

  const handleStartGame = async () => {
    if (!room || room.players.length < 4) {
      alert('Need at least 4 players to start');
      return;
    }

    try {
      const response = await fetch('/api/game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomCode: code,
          event: 'game-started',
          data: null
        })
      });

      if (!response.ok) {
        throw new Error('Failed to start game');
      }
    } catch (error) {
      console.error('Start game error:', error);
      alert('Failed to start game');
    }
  };

  const handleEndGame = async () => {
    if (!room) return;

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
      console.error('End game error:', error);
      alert('Failed to end game');
    }
  };

  const shuffleRoles = async () => {
    if (!room) return;
    
    try {
      const response = await fetch('/api/game', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomCode: room.code,
          event: 'shuffle-roles',
          data: {}
        })
      });

      if (!response.ok) {
        throw new Error('Failed to shuffle roles');
      }
    } catch (error) {
      console.error('Error shuffling roles:', error);
    }
  };

  if (isLoading) {
    return (
      <Container>
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="text-lg">Loading...</div>
        </div>
      </Container>
    );
  }

  if (!room) {
    return (
      <Container>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Room not found</h1>
          <Button onClick={() => router.push('/')} className="mt-4">
            Back to Home
          </Button>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <div className="text-center space-y-2 sm:space-y-3">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Game Room</h1>
        <p className="text-gray-600">Room Code: {room.code}</p>
      </div>

      <Card className="shadow-lg">
        <CardContent className="p-4 sm:p-6">
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold mb-2">Players</h2>
              <div className="space-y-2">
                {room.players.map(player => (
                  <div key={player.id} className="p-2 bg-gray-50 rounded flex justify-between items-center">
                    <span>{player.name}</span>
                    {room.status === 'started' && (
                      <span className="text-sm text-gray-600">
                        {player.role === 'mafia' && '🔪 Mafia'}
                        {player.role === 'detective' && '🔍 Detective'}
                        {player.role === 'doctor' && '💉 Doctor'}
                        {player.role === 'villager' && '🏘️ Villager'}
                      </span>
                    )}
                  </div>
                ))}
              </div>
              {room.players.length < room.minPlayers && (
                <p className="text-sm text-amber-600 mt-2">
                  Need at least 6 players to start
                </p>
              )}
            </div>

            <div className="space-y-2">
              {room.status === 'waiting' && (
                <Button
                  onClick={handleStartGame}
                  className="w-full"
                  disabled={room.players.length < room.minPlayers}
                >
                  Start Game
                </Button>
              )}
              {room.status === 'started' && (
                <Button
                  onClick={shuffleRoles}
                  className="w-full"
                  variant="outline"
                >
                  Shuffle Roles
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
          </div>
        </CardContent>
      </Card>
    </Container>
  );
}

export default function HostPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HostPageContent />
    </Suspense>
  );
} 