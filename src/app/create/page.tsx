'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { GameStore } from '@/utils/gameStore';

/**
 * Fallback create game page that uses the REST API directly
 * This avoids GraphQL/Apollo client issues that might occur
 */
export default function CreateGamePage() {
  const [hostName, setHostName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleCreateGame = async () => {
    if (!hostName.trim()) {
      setError('Please enter your name');
      return;
    }

    try {
      setIsCreating(true);
      setError(null);
      
      // Use GameStore to create room via REST API
      const room = await GameStore.createRoom(hostName);
      
      if (room.code) {
        // Store room info and redirect
        localStorage.setItem('hostRoom', room.code);
        router.push(`/host?code=${room.code}`);
      } else {
        throw new Error('No room code received');
      }
    } catch (err) {
      console.error('Failed to create room:', err);
      setError('Failed to create room. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Container 
      className="bg-background py-8"
      size="compact"
    >
      <div className="text-center space-y-4 mb-8">
        <h1 className="text-4xl font-bold text-primary">
          Create Game
        </h1>
        <p className="text-xl text-muted-foreground">
          Host a new game of Mafia
        </p>
      </div>

      <Card className="border-border/50 overflow-hidden">
        <CardHeader>
          <CardTitle className="text-center text-2xl">Game Setup</CardTitle>
        </CardHeader>
        
        <CardContent className="p-6 space-y-6">
          {error && (
            <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm font-medium">
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label 
                htmlFor="hostName" 
                className="block text-sm font-medium text-foreground mb-1.5"
              >
                Your Name
              </label>
              <input
                type="text"
                id="hostName"
                value={hostName}
                onChange={(e) => setHostName(e.target.value)}
                className="w-full px-4 py-3 border border-input rounded-md shadow-sm
                       focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50
                       bg-background text-foreground transition-colors"
                placeholder="Enter your name"
                maxLength={20}
                disabled={isCreating}
              />
            </div>

            <div className="grid grid-cols-1 gap-3 pt-3">
              <Button 
                variant="default"
                className="w-full font-medium h-12 bg-blue-600 text-white hover:bg-blue-700"
                onClick={handleCreateGame}
                disabled={isCreating}
              >
                {isCreating ? 'Creating...' : 'Create Room'}
              </Button>
              
              <Button 
                variant="secondary"
                className="w-full font-medium h-12 bg-slate-700 text-white hover:bg-slate-600"
                onClick={() => router.push('/')}
                disabled={isCreating}
              >
                Back
              </Button>
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="bg-muted/50 p-4 border-t border-border/50 justify-center">
          <p className="text-sm text-muted-foreground text-center">
            You'll receive a room code to share with friends
          </p>
        </CardFooter>
      </Card>
    </Container>
  );
} 