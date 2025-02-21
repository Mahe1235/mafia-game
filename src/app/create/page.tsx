'use client';

import { CreateGame } from '@/components/game/CreateGame';

export default function CreatePage() {
  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto max-w-md">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-900">Mafia Game</h1>
        <CreateGame />
      </div>
    </div>
  );
} 