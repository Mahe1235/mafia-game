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
    const error = searchParams.get('error');
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
      className="flex flex-col justify-center items-center"
    >
      <div className="text-center space-y-4 mb-8">
        <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-400 to-primary-600">
          Mafia Game
        </h1>
        <p className="text-xl text-foreground/80">
          Create or join a game to start playing
        </p>
      </div>

      <Card 
        variant="default" 
        hover="lift" 
        className="w-full max-w-sm border-border/50 overflow-hidden"
      >
        <CardContent className="p-8 space-y-6">
          <div className="grid grid-cols-1 gap-4">
            <Link href="/create" className="w-full">
              <Button 
                variant="primary" 
                size="lg" 
                className="w-full font-semibold" 
              >
                Create Game
              </Button>
            </Link>
            
            <Button 
              variant="outline" 
              size="lg" 
              className="w-full font-semibold" 
              onClick={() => router.push('/join')}
            >
              Join Game
            </Button>
          </div>
        </CardContent>
        <CardFooter className="bg-background/50 p-4 border-t border-border/50 justify-center">
          <p className="text-sm text-foreground/70">
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg animate-pulse">Loading...</div>
      </div>
    }>
      <HomePageContent />
    </Suspense>
  );
}