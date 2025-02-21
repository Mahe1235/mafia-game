'use client';

import React, { useState } from 'react';
import { Users, Crown, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Home() {
  const [gameMode, setGameMode] = useState('landing'); // landing, create, join, game
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [isHost, setIsHost] = useState(false);
  const [players, setPlayers] = useState<Array<{name: string, isHost: boolean, isReady: boolean}>>([]);
  const [gameStarted, setGameStarted] = useState(false);

  // Generate a random 6-character room code
  const generateRoomCode = () => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    setRoomCode(code);
    return code;
  };

  const handleCreateRoom = () => {
    if (playerName.trim()) {
      setIsHost(true);
      generateRoomCode();
      setPlayers([{ name: playerName, isHost: true, isReady: true }]);
      setGameMode('create');
    }
  };

  const handleJoinRoom = () => {
    if (playerName.trim() && roomCode.trim()) {
      setPlayers(prev => [...prev, { name: playerName, isHost: false, isReady: false }]);
      setGameMode('game');
    }
  };

  const handleCopyRoomCode = () => {
    navigator.clipboard.writeText(roomCode);
  };

  const handleStartGame = () => {
    if (players.length >= 6 && players.every(p => p.isReady)) {
      setGameStarted(true);
    }
  };

  const handleReady = () => {
    setPlayers(prev => 
      prev.map(p => 
        p.name === playerName ? { ...p, isReady: true } : p
      )
    );
  };

  const renderLanding = () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <input
          className="w-full px-4 py-2 border rounded"
          placeholder="Enter your name"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
        />
      </div>
      
      <div className="grid grid-cols-1 gap-4">
        <button 
          className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          onClick={() => setGameMode('create')}
          disabled={!playerName.trim()}
        >
          Create New Game
        </button>
        <button 
          className="w-full border border-blue-500 text-blue-500 px-4 py-2 rounded hover:bg-blue-50"
          onClick={() => setGameMode('join')}
          disabled={!playerName.trim()}
        >
          Join Game
        </button>
      </div>
    </div>
  );

  const renderJoin = () => (
    <div className="space-y-6">
      <input
        className="w-full px-4 py-2 border rounded"
        placeholder="Enter room code"
        value={roomCode}
        onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
        maxLength={6}
      />
      <button 
        className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        onClick={handleJoinRoom}
        disabled={!roomCode.trim()}
      >
        Join Room
      </button>
      <button 
        className="w-full border border-blue-500 text-blue-500 px-4 py-2 rounded hover:bg-blue-50"
        onClick={() => setGameMode('landing')}
      >
        Back
      </button>
    </div>
  );

  const renderGameRoom = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">Room Code:</div>
        <div className="flex items-center space-x-2">
          <code className="bg-gray-100 px-2 py-1 rounded">{roomCode}</code>
          <button
            className="p-1 hover:bg-gray-100 rounded"
            onClick={handleCopyRoomCode}
          >
            <Copy className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <div className="text-sm font-medium">Players ({players.length}/20):</div>
        {players.map((player, index) => (
          <div 
            key={index}
            className="flex items-center justify-between p-2 bg-gray-100 rounded"
          >
            <div className="flex items-center space-x-2">
              {player.isHost && <Crown className="h-4 w-4 text-yellow-500" />}
              <span>{player.name}</span>
            </div>
            <div className="text-sm">
              {player.isReady ? "Ready" : "Not Ready"}
            </div>
          </div>
        ))}
      </div>

      {!isHost && !gameStarted && (
        <button 
          className="w-full bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          onClick={handleReady}
          disabled={players.find(p => p.name === playerName)?.isReady}
        >
          Ready Up
        </button>
      )}

      {isHost && (
        <button
          className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          onClick={handleStartGame}
          disabled={players.length < 6 || !players.every(p => p.isReady)}
        >
          Start Game
        </button>
      )}

      {players.length < 6 && (
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded text-sm">
          Waiting for more players... Need {6 - players.length} more to start.
        </div>
      )}
    </div>
  );

  return (
    <main className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-md mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-center mb-6">Mafia Game</h1>
          {gameMode === 'landing' && renderLanding()}
          {gameMode === 'join' && renderJoin()}
          {(gameMode === 'create' || gameMode === 'game') && renderGameRoom()}
        </div>
      </div>
    </main>
  );
}