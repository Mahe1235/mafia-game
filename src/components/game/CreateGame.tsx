'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { GameStore } from '@/utils/gameStore';

export function CreateGame() {
  const [playerName, setPlayerName] = useState('');
  const router = useRouter();

  const handleCreateGame = async () => {
    if (!playerName.trim()) {
      alert('Please enter your name');
      return;
    }

    const room = await GameStore.createRoom(playerName);
    
    localStorage.setItem('hostRoom', room.code);
    router.push(`/host?code=${room.code}`);
  };

  return (
    <Container>
      <h1 className="text-3xl sm:text-4xl font-bold text-center text-gray-900 mb-6">
        Create Game
      </h1>
      
      <Card className="shadow-lg">
        <CardContent className="p-4 sm:p-6">
          <div className="space-y-4 sm:space-y-6">
            <div className="space-y-1.5 sm:space-y-2">
              <label className="text-sm font-medium text-gray-700">Your Name</label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="w-full p-2.5 sm:p-3 border border-gray-200 rounded-lg bg-white text-gray-900 
                          focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none
                          transition-colors text-base sm:text-lg"
                placeholder="Enter your name"
              />
            </div>

            <div className="pt-2 sm:pt-4 space-y-2 sm:space-y-3">
              <Button 
                onClick={handleCreateGame} 
                className="w-full h-10 sm:h-12 text-base sm:text-lg font-medium bg-blue-600 hover:bg-blue-700
                         transition-colors"
              >
                Create Room
              </Button>
              <Button 
                onClick={() => router.push('/')} 
                variant="outline" 
                className="w-full h-10 sm:h-12 text-base sm:text-lg font-medium border-2"
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