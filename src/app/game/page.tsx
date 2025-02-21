'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { pusherClient } from '@/lib/pusher';
import type { GameRoom, Player, PlayerSession } from '@/types/game';
import { RoleDescriptions, RoleIcons, RoleNames } from '@/utils/roles';

function GamePageContent() {
  const [room, setRoom] = useState<GameRoom | null>(null);
  const [player, setPlayer] = useState<PlayerSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get('code')?.toUpperCase();

  useEffect(() => {
    if (!code) {
      router.replace('/?error=invalid-code');
      return;
    }

    // Load player session
    const sessionData = sessionStorage.getItem('playerSession');
    if (!sessionData) {
      router.replace('/?error=session-expired');
      return;
    }

    const playerSession: PlayerSession = JSON.parse(sessionData);
    if (playerSession.roomCode !== code) {
      router.replace('/?error=invalid-session');
      return;
    }

    setPlayer(playerSession);

    // Fetch initial room state
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
        setError('Failed to load game');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRoom();

    // Subscribe to game updates
    const channel = pusherClient.subscribe(`game-${code}`);
    
    channel.bind('player-joined', (newPlayer: Player) => {
      setRoom(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          players: [...prev.players, newPlayer]
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
      
      // Update player's role
      const updatedPlayer = players.find(p => p.id === playerSession.id);
      if (updatedPlayer) {
        playerSession.role = updatedPlayer.role;
        sessionStorage.setItem('playerSession', JSON.stringify(playerSession));
        setPlayer(playerSession);
      }
    });

    channel.bind('game-ended', (data: { reason: string }) => {
      sessionStorage.removeItem('playerSession');
      router.replace(`/?error=${data.reason}`);
    });

    return () => {
      channel.unbind_all();
      pusherClient.unsubscribe(`game-${code}`);
    };
  }, [code, router]);

  if (isLoading) {
    return (
      <Container>
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="text-lg">Loading game...</div>
        </div>
      </Container>
    );
  }

  if (error || !room || !player) {
    return (
      <Container>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">
            {error || 'Game not found'}
          </h1>
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
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
          {room.status === 'waiting' ? 'Waiting Room' : 'Game Room'}
        </h1>
        <p className="text-gray-600">Room Code: {room.code}</p>
      </div>

      <Card className="shadow-lg mt-6">
        <CardContent className="p-4 sm:p-6">
          <div className="space-y-4">
            {room.status === 'waiting' ? (
              <>
                <div>
                  <h2 className="text-xl font-semibold mb-2">Players</h2>
                  <div className="space-y-2">
                    {room.players.map(p => (
                      <div 
                        key={p.id} 
                        className={`p-2 rounded-md ${
                          p.id === player.id 
                            ? 'bg-blue-50 border border-blue-200' 
                            : 'bg-gray-50'
                        }`}
                      >
                        <span className="text-xl mr-2">
                          {p.role === 'mafia' && '🔪'}
                          {p.role === 'detective' && '🔍'}
                          {p.role === 'doctor' && '💉'}
                          {p.role === 'villager' && '🏘️'}
                        </span>
                        {p.name} {p.id === player.id && '(You)'}
                      </div>
                    ))}
                  </div>
                </div>
                <p className="text-sm text-gray-500 text-center">
                  Waiting for the host to start the game...
                </p>
              </>
            ) : (
              <div className="space-y-4">
                {room.status === 'started' && (
                  <div className="space-y-4">
                    <div className="text-center p-4 bg-blue-50 rounded-md">
                      <h2 className="text-lg font-semibold text-blue-900 flex items-center justify-center gap-2">
                        <span className="text-2xl">
                          {player.role && RoleIcons[player.role]}
                        </span>
                        <span>
                          Your Role: {player.role ? RoleNames[player.role] : RoleNames.unassigned}
                        </span>
                      </h2>
                      <p className="text-sm text-blue-700 mt-1">
                        {player.role ? RoleDescriptions[player.role] : RoleDescriptions.unassigned}
                      </p>
                    </div>

                    <div>
                      <h2 className="text-xl font-semibold mb-2">Players</h2>
                      <div className="space-y-2">
                        {room.players.map(p => (
                          <div 
                            key={p.id} 
                            className={`p-2 rounded-md ${
                              p.id === player.id 
                                ? 'bg-blue-50 border border-blue-200' 
                                : 'bg-gray-50'
                            }`}
                          >
                            {p.id === player.id && (
                              <span className="text-xl mr-2">
                                {p.role === 'mafia' && '🔪'}
                                {p.role === 'detective' && '🔍'}
                                {p.role === 'doctor' && '💉'}
                                {p.role === 'villager' && '🏘️'}
                              </span>
                            )}
                            {p.name} {p.id === player.id && '(You)'}
                            {!p.isAlive && ' (Dead)'}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Container>
  );
}

export default function GamePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <GamePageContent />
    </Suspense>
  );
} 