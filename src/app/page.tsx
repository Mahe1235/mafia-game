'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
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
    <Container>
      <div className="text-center space-y-2 sm:space-y-3">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Mafia Game</h1>
        <p className="text-gray-600">Create or join a game to start playing</p>
      </div>

      <Card className="shadow-lg">
        <CardContent className="p-4 sm:p-6">
          <div className="space-y-2 sm:space-y-3">
            <Link href="/create" className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-lg font-medium transition-colors inline-flex justify-center items-center">
              Create Game
            </Link>
            <Button 
              onClick={() => router.push('/join')} 
              variant="outline" 
              className="w-full h-10 sm:h-12 text-base sm:text-lg font-medium border-2"
            >
              Join Game
            </Button>
          </div>
        </CardContent>
      </Card>
    </Container>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HomePageContent />
    </Suspense>
  );
}