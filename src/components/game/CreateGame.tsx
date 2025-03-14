'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@apollo/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { mutations } from '@/lib/graphql';
import { logger } from '@/utils/logger';

/**
 * Component for creating a new game room
 * Handles host name input and room creation via GraphQL
 */
export function CreateGame() {
  const [hostName, setHostName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const router = useRouter();

  const [createRoom] = useMutation(mutations.CREATE_ROOM, {
    onError: (error) => {
      logger.error('Failed to create room:', error);
      alert('Failed to create room');
    }
  });

  const handleCreateGame = async () => {
    if (!hostName.trim()) {
      alert('Please enter your name');
      return;
    }

    try {
      setIsCreating(true);
      const { data } = await createRoom({
        variables: { hostName }
      });
      
      if (data?.createRoom?.code) {
        localStorage.setItem('hostRoom', data.createRoom.code);
        router.push(`/host?code=${data.createRoom.code}`);
      } else {
        throw new Error('No room code received');
      }
    } catch (error) {
      logger.error('Create room error:', error);
      alert('Failed to create room');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Container>
      <div className="text-center space-y-2 sm:space-y-3">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Create Game</h1>
        <p className="text-gray-600">Host a new game of Mafia</p>
      </div>

      <Card className="shadow-lg">
        <CardContent className="p-4 sm:p-6">
          <div className="space-y-4 sm:space-y-6">
            <div>
              <label htmlFor="hostName" className="block text-sm font-medium text-gray-700 mb-1">
                Your Name
              </label>
              <input
                type="text"
                id="hostName"
                value={hostName}
                onChange={(e) => setHostName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm 
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your name"
                maxLength={20}
                disabled={isCreating}
              />
            </div>

            <div className="space-y-2 sm:space-y-3">
              <Button 
                onClick={handleCreateGame} 
                className="w-full h-10 sm:h-12 text-base sm:text-lg font-medium bg-blue-600 hover:bg-blue-700
                         transition-colors"
                disabled={isCreating}
              >
                {isCreating ? 'Creating...' : 'Create Room'}
              </Button>
              <Button 
                onClick={() => router.push('/')} 
                variant="outline" 
                className="w-full h-10 sm:h-12 text-base sm:text-lg font-medium border-2"
                disabled={isCreating}
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