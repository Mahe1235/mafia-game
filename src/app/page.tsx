'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import Link from 'next/link';

function HomePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const error = searchParams?.get('error');
    if (error) {
      const errorMessages = {
        'host-left': 'The host has ended the game.',
        'session-expired': 'Your session has expired.',
        'connection-lost': 'Connection to the game was lost.'
      };
      alert(errorMessages[error as keyof typeof errorMessages] || 'An error occurred.');
    }
  }, [searchParams]);

  return (
    <Container 
      variant="dark" 
      size="compact" 
      padding="md"
      animation="fadeIn" 
      className="flex flex-col justify-center items-center py-12"
    >
      <div className="text-center space-y-4 mb-8">
        <h1 className="text-5xl font-bold text-white">
          Mafia Game
        </h1>
        <p className="text-xl text-gray-300 font-medium">
          Create or join a game to start playing
        </p>
      </div>

      <Card 
        className="w-full max-w-sm overflow-hidden bg-gray-800 border border-gray-700 shadow-xl"
      >
        <CardContent className="p-8 space-y-6">
          <div className="grid grid-cols-1 gap-4">
            <Link href="/create" className="w-full">
              <Button 
                variant="primary" 
                size="lg" 
                className="w-full font-semibold bg-red-600 hover:bg-red-700 text-white" 
              >
                Create Game
              </Button>
            </Link>
            
            <Button 
              variant="outline" 
              size="lg" 
              className="w-full font-semibold border-gray-600 text-gray-300 hover:bg-gray-700" 
              onClick={() => router.push('/join')}
            >
              Join Game
            </Button>
          </div>
        </CardContent>
        <CardFooter className="bg-gray-900 p-4 border-t border-gray-700 justify-center">
          <p className="text-sm text-gray-400 font-medium italic">
            Night falls. The town sleeps. But some are still awake...
          </p>
        </CardFooter>
      </Card>
    </Container>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 to-black">
        <div className="text-lg text-white animate-pulse">Loading...</div>
      </div>
    }>
      <HomePageContent />
    </Suspense>
  );
}