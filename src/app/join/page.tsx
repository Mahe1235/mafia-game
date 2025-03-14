'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import type { PlayerSession } from '@/types/game';

function JoinPageContent() {
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get('code');
    if (code) {
      setRoomCode(code.toUpperCase());
      validateRoom(code.toUpperCase());
    }
  }, [searchParams]);

  const validateRoom = async (code: string) => {
    try {
      const response = await fetch(`/api/game?code=${code}`);
      if (!response.ok) {
        setError('Room not found');
        return;
      }
      const room = await response.json();
      if (room.status !== 'waiting') {
        setError('This game has already started');
      } else {
        setError(null);
      }
    } catch {
      setError('Invalid room code');
    }
  };

  const handleJoinGame = async () => {
    if (!playerName.trim() || !roomCode.trim()) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setIsJoining(true);
      setError(null);

      const response = await fetch('/api/game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomCode: roomCode.toUpperCase(),
          event: 'player-joined',
          data: { name: playerName }
        })
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const player = await response.json();
      
      // Save player session
      const session: PlayerSession = {
        id: player.id,
        name: playerName,
        roomCode: roomCode.toUpperCase(),
        role: player.role
      };
      sessionStorage.setItem('playerSession', JSON.stringify(session));

      router.push(`/game?code=${roomCode.toUpperCase()}`);
    } catch (error) {
      console.error('Join error:', error);
      setError('Failed to join room. Please try again.');
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <Container>
      <div className="text-center space-y-2 sm:space-y-3">
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground">Join Game</h1>
        <p className="text-muted-foreground">Enter a room code to join</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-center">Enter Game Details</CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="space-y-4 sm:space-y-6">
            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md text-destructive text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="roomCode" className="block text-sm font-medium text-foreground mb-1">
                Room Code
              </label>
              <input
                type="text"
                id="roomCode"
                value={roomCode}
                onChange={(e) => {
                  const code = e.target.value.toUpperCase();
                  setRoomCode(code);
                  if (code.length === 6) {
                    validateRoom(code);
                  }
                }}
                className="w-full px-3 py-2 border border-input rounded-md shadow-sm 
                         focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50
                         bg-background text-foreground uppercase"
                placeholder="Enter room code"
                maxLength={6}
                disabled={isJoining}
              />
            </div>

            <div>
              <label htmlFor="playerName" className="block text-sm font-medium text-foreground mb-1">
                Your Name
              </label>
              <input
                type="text"
                id="playerName"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md shadow-sm 
                         focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50
                         bg-background text-foreground"
                placeholder="Enter your name"
                maxLength={20}
                disabled={isJoining}
              />
            </div>

            <div className="space-y-2 sm:space-y-3">
              <Button 
                onClick={handleJoinGame} 
                className="w-full h-10 sm:h-12 text-base sm:text-lg font-medium"
                disabled={isJoining || !!error}
              >
                {isJoining ? 'Joining...' : 'Join Game'}
              </Button>
              <Button 
                onClick={() => router.push('/')} 
                variant="outline" 
                className="w-full h-10 sm:h-12 text-base sm:text-lg font-medium"
                disabled={isJoining}
              >
                Back
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </Container>
  );
}

export default function JoinPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><div className="text-foreground">Loading...</div></div>}>
      <JoinPageContent />
    </Suspense>
  );
}