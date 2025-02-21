'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { useEffect } from 'react';

export default function Home() {
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
      <div className="text-center space-y-3 sm:space-y-4 mb-6 sm:mb-8">
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900">
          Mafia Game
        </h1>
        <p className="text-base sm:text-lg text-gray-600">
          Play the classic social deduction game with friends!
        </p>
      </div>

      <Card className="shadow-lg">
        <CardContent className="p-4 sm:p-6">
          <div className="space-y-3 sm:space-y-4">
            <Button 
              onClick={() => router.push('/create')}
              className="w-full h-12 sm:h-14 text-lg sm:text-xl font-medium bg-blue-600 hover:bg-blue-700
                       transition-colors"
            >
              Create Game
            </Button>
            <Button 
              onClick={() => router.push('/join')}
              className="w-full h-12 sm:h-14 text-lg sm:text-xl font-medium bg-green-600 hover:bg-green-700
                       transition-colors"
            >
              Join Game
            </Button>
          </div>
        </CardContent>
      </Card>
    </Container>
  );
}