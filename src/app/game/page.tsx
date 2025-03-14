'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Container } from '@/components/ui/container';
import { pusherClient } from '@/lib/pusher';
import type { GameRoom, Player, PlayerSession } from '@/types/game';
import { RoleDescriptions, RoleIcons, RoleNames, RoleColors } from '@/utils/roles';

function GameContent() {
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
    <Container className="py-6">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-primary">Game Room</h1>
            <p className="text-muted-foreground">Code: {code}</p>
          </div>
          <Badge variant={room.status === 'waiting' ? 'default' : room.status === 'started' ? 'outline' : 'destructive'} className="px-3 py-1 text-md">
            {room.status === 'waiting' ? 'Waiting Room' : room.status === 'started' ? 'Game Started' : 'Game Ended'}
          </Badge>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Your Role: {player.role ? RoleNames[player.role] : RoleNames.unassigned}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              {player.role ? RoleDescriptions[player.role] : RoleDescriptions.unassigned}
            </p>
            {player.role && player.role !== 'villager' && (
              <Button onClick={() => console.log('Special role action')} className="mt-4">
                Use Special Action
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Players</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {room.players.map((p) => (
                <div 
                  key={p.id} 
                  className={`p-4 rounded-lg border ${
                    !p.isAlive 
                      ? 'border-muted bg-muted/40' 
                      : p.id === player.id 
                        ? 'border-border bg-card' 
                        : 'border-muted bg-muted/40'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className={!p.isAlive ? 'line-through text-muted-foreground' : ''}>
                      {p.name}
                    </span>
                    <Badge variant={p.isAlive ? 'outline' : 'secondary'}>
                      {p.isAlive ? 'Alive' : 'Dead'}
                    </Badge>
                  </div>
                  {room.status === 'started' && p.isAlive && p.id === player.id && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="mt-2 w-full"
                      onClick={() => console.log(`Voted for player ${p.id}`)}
                    >
                      Vote
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Game Log</CardTitle>
          </CardHeader>
          <CardContent className="max-h-[200px] overflow-y-auto">
            <div className="space-y-2">
              <p className="text-sm">{getFooterText()}</p>
            </div>
          </CardContent>
          <CardFooter className="border-t">
            <Button variant="outline" onClick={() => router.push('/')} className="mr-2">
              Leave Game
            </Button>
            <Button variant="default" onClick={() => console.log('Next phase')}>
              Ready for Next Phase
            </Button>
          </CardFooter>
        </Card>
      </div>
    </Container>
  );
}

export default function GamePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background">Loading game...</div>}>
      <GameContent />
    </Suspense>
  );
} 