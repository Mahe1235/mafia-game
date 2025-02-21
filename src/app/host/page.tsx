'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { GameStore } from '@/utils/gameStore';
import { Container } from '@/components/ui/container';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Player } from '@/types/game';

function HostPageContent() {
  const [room, setRoom] = useState<{ code: string; players: Player[] } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get('code')?.toUpperCase();

  useEffect(() => {
    if (!code) {
      router.replace('/?error=invalid-code');
      return;
    }

    const isValidHost = GameStore.validateSession(code);
    if (!isValidHost) {
      router.replace('/?error=session-expired');
      return;
    }

    const currentRoom = GameStore.getRoom(code);
    if (!currentRoom) {
      router.replace('/?error=room-not-found');
      return;
    }

    setRoom(currentRoom);
    setIsLoading(false);

    const cleanup = GameStore.subscribeToRoom(code, {
      onPlayerJoined: (player) => {
        setRoom(prev => prev ? {
          ...prev,
          players: [...prev.players, player]
        } : null);
      }
    });

    return () => {
      cleanup();
    };
  }, [code, router]);

  const handleStartGame = async () => {
    if (!room || room.players.length < 2) {
      alert('Need at least 2 players to start');
      return;
    }

    try {
      await fetch('/api/game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomCode: room.code,
          event: 'game-started',
          data: room.players
        })
      });
    } catch (error) {
      console.error('Start game error:', error);
      alert('Failed to start game');
    }
  };

  const handleEndGame = async () => {
    if (!room) return;
    await GameStore.cleanupRoom(room.code);
    router.replace('/');
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!room) {
    return <div>Room not found</div>;
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
              <h2 className="text-xl font-semibold mb-2">Players ({room.players.length})</h2>
              <div className="space-y-2">
                {room.players.map(player => (
                  <div key={player.id} className="p-2 bg-gray-50 rounded">
                    {player.name}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Button
                onClick={handleStartGame}
                className="w-full"
                disabled={room.players.length < 2}
              >
                Start Game
              </Button>
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