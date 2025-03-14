'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { pusherClient } from '@/lib/pusher';
import type { GameRoom, Player, PlayerSession } from '@/types/game';
import { RoleDescriptions, RoleIcons, RoleNames, RoleColors } from '@/utils/roles';

function GamePageContent() {
  const [room, setRoom] = useState<GameRoom | null>(null);
  const [player, setPlayer] = useState<PlayerSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams?.get('code')?.toUpperCase();

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
      <Container variant="dark">
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="text-lg text-white">Loading game...</div>
        </div>
      </Container>
    );
  }

  if (error || !room || !player) {
    return (
      <Container variant="dark">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-400">
            {error || 'Game not found'}
          </h1>
          <Button onClick={() => router.push('/')} className="mt-4">
            Back to Home
          </Button>
        </div>
      </Container>
    );
  }

  // Get witty footer text based on game status and player role
  const getFooterText = () => {
    if (room.status === 'waiting') {
      return "The tension builds... who will be the hunter and who will be the hunted?";
    }
    
    if (!player.role) return "Identity crisis? Don't worry, you'll be assigned a role soon!";
    
    switch(player.role) {
      case 'mafia':
        return "Remember: What happens in the mafia, stays in the mafia. Unless someone snitches...";
      case 'detective':
        return "Sherlock has nothing on you. Keep those eyes peeled and trust no one!";
      case 'doctor':
        return "With great stethoscope comes great responsibility. Choose wisely!";
      case 'villager':
        return "No special powers? No problem! Your paranoia is your superpower.";
      default:
        return "Night falls. The town sleeps. But some are still awake...";
    }
  };

  return (
    <Container variant="dark" className="pb-8 px-4 sm:px-6 md:px-8">
      <div className="text-center space-y-2 sm:space-y-3">
        <h1 className="text-3xl sm:text-4xl font-bold text-white">
          {room.status === 'waiting' ? 'Waiting Room' : 'Game Room'}
        </h1>
        <p className="text-gray-300">Room Code: {room.code}</p>
      </div>

      <Card className="shadow-lg mt-6 bg-gray-900 border border-gray-700">
        <CardContent className="p-4 sm:p-6">
          <div className="space-y-4">
            {room.status === 'waiting' ? (
              <>
                <div>
                  <h2 className="text-xl font-semibold mb-2 text-white">Players</h2>
                  <div className="space-y-2">
                    {room.players.map(p => (
                      <div 
                        key={p.id} 
                        className={`p-3 rounded-md flex items-center ${
                          p.id === player.id 
                            ? 'bg-gray-700 border border-blue-500' 
                            : 'bg-gray-800'
                        }`}
                      >
                        <span className="text-xl mr-2">
                          {p.role === 'mafia' && '🔪'}
                          {p.role === 'detective' && '🔍'}
                          {p.role === 'doctor' && '💉'}
                          {p.role === 'villager' && '🏘️'}
                        </span>
                        <span className="font-medium text-white">{p.name}</span> 
                        {p.id === player.id && <span className="ml-1 text-blue-400 font-medium">(You)</span>}
                      </div>
                    ))}
                  </div>
                </div>
                <p className="text-sm text-gray-300 text-center font-medium mt-4">
                  Waiting for the host to start the game...
                </p>
              </>
            ) : (
              <div className="space-y-4">
                {room.status === 'started' && (
                  <div className="space-y-4">
                    <div className="text-center p-5 rounded-md bg-black border border-gray-700">
                      <h2 className="text-lg font-bold flex items-center justify-center gap-2 text-white">
                        <span className="text-2xl">
                          {player.role && RoleIcons[player.role]}
                        </span>
                        <span>
                          Your Role: {player.role ? RoleNames[player.role] : RoleNames.unassigned}
                        </span>
                      </h2>
                      <p className="text-gray-300 mt-3 font-medium leading-relaxed">
                        {player.role ? RoleDescriptions[player.role] : RoleDescriptions.unassigned}
                      </p>
                    </div>

                    <div>
                      <h2 className="text-xl font-semibold mb-2 text-white">Players</h2>
                      <div className="space-y-2">
                        {room.players.map(p => (
                          <div 
                            key={p.id} 
                            className={`p-3 rounded-md flex items-center ${
                              !p.isAlive 
                                ? 'bg-red-900 text-red-100 line-through opacity-75' 
                                : p.id === player.id 
                                  ? 'bg-gray-700 border border-blue-500' 
                                  : 'bg-gray-800'
                            }`}
                          >
                            {p.id === player.id && p.role && (
                              <span className={`text-xl mr-2 ${p.role && RoleColors[p.role]}`}>
                                {RoleIcons[p.role]}
                              </span>
                            )}
                            <span className="font-medium text-white">{p.name}</span> 
                            {p.id === player.id && <span className="ml-1 text-blue-400 font-medium">(You)</span>}
                            {!p.isAlive && <span className="ml-1 text-red-300 font-medium">(Dead)</span>}
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
        <div className="border-t border-gray-700 p-4 bg-gray-900 rounded-b-md">
          <p className="text-center text-sm font-medium text-gray-400 italic">
            {getFooterText()}
          </p>
        </div>
      </Card>
    </Container>
  );
}

export default function GamePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-800 flex items-center justify-center text-white">Loading...</div>}>
      <GamePageContent />
    </Suspense>
  );
} 