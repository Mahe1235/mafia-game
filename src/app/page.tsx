'use client';

import { useState } from 'react';

export default function Home() {
  const [playerName, setPlayerName] = useState('');
  const [error, setError] = useState('');

  const handleAction = (action: 'create' | 'join') => {
    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }
    setError('');
    console.log(`${action} game clicked with name: ${playerName}`);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-6">
      <h1 className="text-3xl sm:text-4xl font-bold mb-8 text-center">Mafia Game</h1>
      
      <div className="flex flex-col gap-4 w-full max-w-sm px-4">
        <input
          type="text"
          placeholder="Enter your name"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          className="px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg text-black bg-white"
        />
        {error && <p className="text-red-500 text-sm">{error}</p>}
        
        <button 
          className="px-6 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-lg font-medium"
          onClick={() => handleAction('create')}
        >
          Create Game
        </button>
        
        <button 
          className="px-6 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-lg font-medium"
          onClick={() => handleAction('join')}
        >
          Join Game
        </button>
      </div>
    </div>
  );
}