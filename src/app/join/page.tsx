'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { GameStore } from '@/utils/gameStore';

function JoinPageContent() {
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get('code');
    if (code) {
      setRoomCode(code.toUpperCase());
    }
  }, [searchParams]);

  const handleJoinGame = async () => {
    if (!playerName.trim() || !roomCode.trim()) {
      alert('Please fill in all fields');
      return;
    }

    try {
      setIsJoining(true);
      const player = await GameStore.joinRoom(roomCode.toUpperCase(), playerName);
      
      if (!player) {
        alert('Room not found or unable to join. Please check the room code.');
        return;
      }

      // Wait a moment to ensure storage is set
      await new Promise(resolve => setTimeout(resolve, 100));
      
      router.push(`/game?code=${roomCode.toUpperCase()}`);
    } catch (error) {
      console.error('Join error:', error);
      alert('Failed to join room. Please try again.');
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <Container>
      <div className="text-center space-y-2 sm:space-y-3">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Join Game</h1>
        <p className="text-gray-600">Enter a room code to join</p>
      </div>

      <Card className="shadow-lg">
        <CardContent className="p-4 sm:p-6">
          <div className="space-y-4 sm:space-y-6">
            <div>
              <label htmlFor="roomCode" className="block text-sm font-medium text-gray-700 mb-1">
                Room Code
              </label>
              <input
                type="text"
                id="roomCode"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm 
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter room code"
                maxLength={6}
                disabled={isJoining}
              />
            </div>

            <div>
              <label htmlFor="playerName" className="block text-sm font-medium text-gray-700 mb-1">
                Your Name
              </label>
              <input
                type="text"
                id="playerName"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm 
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your name"
                maxLength={20}
                disabled={isJoining}
              />
            </div>

            <div className="space-y-2 sm:space-y-3">
              <Button 
                onClick={handleJoinGame} 
                className="w-full h-10 sm:h-12 text-base sm:text-lg font-medium bg-blue-600 hover:bg-blue-700
                         transition-colors"
                disabled={isJoining}
              >
                {isJoining ? 'Joining...' : 'Join Game'}
              </Button>
              <Button 
                onClick={() => router.push('/')} 
                variant="outline" 
                className="w-full h-10 sm:h-12 text-base sm:text-lg font-medium border-2"
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
    <Suspense fallback={<div>Loading...</div>}>
      <JoinPageContent />
    </Suspense>
  );
}