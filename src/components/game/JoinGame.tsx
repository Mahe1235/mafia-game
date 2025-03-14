/**
 * Component for joining an existing game room
 * Handles player name input and room joining via GraphQL
 */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { useGame } from '@/hooks/useGame';
import { logger } from '@/utils/logger';

interface JoinGameProps {
  initialCode?: string;
}

export function JoinGame({ initialCode = '' }: JoinGameProps) {
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState(initialCode.toUpperCase());
  const [isJoining, setIsJoining] = useState(false);
  const router = useRouter();
  const { joinRoom } = useGame();

  const handleJoinGame = async () => {
    if (!playerName.trim() || !roomCode.trim()) {
      alert('Please enter your name and room code');
      return;
    }

    try {
      setIsJoining(true);
      const { data } = await joinRoom({
        variables: {
          code: roomCode,
          playerName: playerName.trim()
        }
      });

      if (!data?.joinRoom) {
        throw new Error('Failed to join room');
      }

      // Store minimal player info in sessionStorage for security
      const playerInfo = {
        id: data.joinRoom.id,
        name: playerName,
        roomCode: roomCode
      };
      sessionStorage.setItem('playerSession', JSON.stringify(playerInfo));

      router.push(`/game?code=${roomCode}`);
    } catch (error) {
      logger.error('Join room error:', error);
      alert('Could not join room. Room might be full or game already started.');
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <Container>
      <div className="text-center space-y-2 sm:space-y-3">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Join Game</h1>
        <p className="text-gray-600">Enter room code to join</p>
      </div>

      <Card className="shadow-lg">
        <CardContent className="p-4 sm:p-6">
          <div className="space-y-4 sm:space-y-6">
            <div className="space-y-1.5 sm:space-y-2">
              <label htmlFor="playerName" className="block text-sm font-medium text-gray-700">
                Your Name
              </label>
              <input
                type="text"
                id="playerName"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="w-full p-2.5 sm:p-3 border border-gray-200 rounded-lg bg-white text-gray-900 
                          focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none
                          transition-colors text-base sm:text-lg"
                placeholder="Enter your name"
                maxLength={20}
                disabled={isJoining}
              />
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <label htmlFor="roomCode" className="block text-sm font-medium text-gray-700">
                Room Code
              </label>
              <input
                type="text"
                id="roomCode"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                className="w-full p-2.5 sm:p-3 border border-gray-200 rounded-lg bg-white text-gray-900 
                          focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none
                          transition-colors text-center uppercase tracking-widest font-mono
                          text-base sm:text-lg"
                placeholder="ENTER CODE"
                maxLength={6}
                disabled={isJoining}
              />
            </div>

            <div className="pt-2 sm:pt-4 space-y-2 sm:space-y-3">
              <Button 
                onClick={handleJoinGame} 
                className="w-full h-10 sm:h-12 text-base sm:text-lg font-medium bg-blue-600 hover:bg-blue-700
                         transition-colors"
                disabled={isJoining}
              >
                {isJoining ? 'Joining...' : 'Join Room'}
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