'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { GameStore } from '@/utils/gameStore';
import { RoleIcons, RoleColors } from '@/utils/roles';
import type { Player, GameStatus } from '@/types/game';

export default function HostPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [room, setRoom] = useState<{
    code: string;
    hostName: string;
    players: Player[];
    status: GameStatus;
  } | null>(null);

  useEffect(() => {
    const code = searchParams.get('code');
    const storedCode = localStorage.getItem('hostRoom');
    
    if (!code || code !== storedCode) {
      router.push('/');
      return;
    }

    // Validate host session
    if (!GameStore.validateSession(code)) {
      localStorage.removeItem('hostRoom');
      router.push('/?error=session-expired');
      return;
    }

    const gameRoom = GameStore.getRoom(code);
    if (!gameRoom) {
      router.push('/');
      return;
    }

    setRoom(gameRoom);

    // Subscribe to real-time updates
    const unsubscribe = GameStore.subscribeToRoom(code, {
      onPlayerJoin: (player) => {
        setRoom(currentRoom => {
          if (!currentRoom) return null;
          return {
            ...currentRoom,
            players: [...currentRoom.players, player]
          };
        });
      },
      onPlayerLeave: (playerId) => {
        setRoom(currentRoom => {
          if (!currentRoom) return null;
          return {
            ...currentRoom,
            players: currentRoom.players.filter(p => p.id !== playerId)
          };
        });
      },
      onGameStart: (players) => {
        setRoom(currentRoom => {
          if (!currentRoom) return null;
          return {
            ...currentRoom,
            players,
            status: 'in-progress'
          };
        });
      },
      onGameReset: () => {
        setRoom(currentRoom => {
          if (!currentRoom) return null;
          return {
            ...currentRoom,
            status: 'waiting',
            players: currentRoom.players.map(({ id, name }) => ({ id, name }))
          };
        });
      }
    });

    // Handle cleanup when host leaves/closes tab
    const handleBeforeUnload = () => {
      if (room) {
        GameStore.cleanupRoom(room.code);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (room) {
        GameStore.cleanupRoom(room.code);
      }
      unsubscribe();
    };
  }, [room, searchParams, router]);

  const handleStartGame = async () => {
    if (!room) return;
    
    if (room.players.length < 6) {
      alert('Need at least 6 players to start');
      return;
    }

    // Calculate roles
    const playerCount = room.players.length;
    const mafiaCount = Math.max(1, Math.round(playerCount / 3));
    const detectiveCount = playerCount >= 9 ? 2 : 1;
    const doctorCount = playerCount >= 10 ? 2 : 1;
    const villagerCount = playerCount - mafiaCount - detectiveCount - doctorCount;

    // Create role array
    const roles: string[] = [
      ...Array(mafiaCount).fill('Mafia'),
      ...Array(detectiveCount).fill('Detective'),
      ...Array(doctorCount).fill('Doctor'),
      ...Array(villagerCount).fill('Villager')
    ];

    // Shuffle roles
    const shuffledRoles = roles.sort(() => Math.random() - 0.5);

    // Assign roles to players
    const playersWithRoles = room.players.map((player, index) => ({
      ...player,
      role: shuffledRoles[index] as Player['role']
    }));

    // Update game room with roles
    await GameStore.startGame(room.code, playersWithRoles);
  };

  const handleNewGame = async () => {
    if (!room) return;
    await GameStore.resetGame(room.code);
  };

  const handleExitGame = async () => {
    if (room) {
      await GameStore.cleanupRoom(room.code);
      localStorage.removeItem('hostRoom');
      router.push('/');
    }
  };

  if (!room) {
    return <div>Loading...</div>;
  }

  return (
    <Container>
      <div className="text-center space-y-2 sm:space-y-3">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Game Room</h1>
        <div className="inline-block px-4 sm:px-6 py-1.5 sm:py-2 bg-white rounded-full shadow-sm">
          <p className="text-base sm:text-lg font-mono tracking-widest text-gray-900">
            Room Code: {room.code}
          </p>
        </div>
      </div>
      
      <Card className="shadow-lg">
        <CardContent className="p-4 sm:p-6">
          <div className="space-y-4 sm:space-y-6">
            <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900">Players</h3>
                <span className="px-2.5 py-1 bg-white rounded-full text-sm font-medium text-gray-600 shadow-sm">
                  {room.players.length} joined
                </span>
              </div>
              
              <div className="space-y-2">
                {room.players.map((player) => (
                  <div 
                    key={player.id}
                    className="flex items-center justify-between p-2.5 bg-white rounded-lg shadow-sm"
                  >
                    <span className="font-medium text-gray-900">{player.name}</span>
                    {room.status === 'in-progress' && player.role && (
                      <div className={`flex items-center gap-2 px-3 py-1 rounded-full bg-gray-50 
                                    ${RoleColors[player.role]} text-sm font-medium`}>
                        <span>{RoleIcons[player.role]}</span>
                        <span>{player.role}</span>
                      </div>
                    )}
                  </div>
                ))}

                {room.players.length < 6 && (
                  <div className="text-center py-2">
                    <p className="text-sm text-gray-500">
                      Need {6 - room.players.length} more player{room.players.length === 5 ? '' : 's'} to start
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2 sm:space-y-3">
              {room.status === 'waiting' ? (
                <Button 
                  onClick={handleStartGame} 
                  disabled={room.players.length < 6}
                  className={`w-full h-10 sm:h-12 text-base sm:text-lg font-medium transition-colors
                    ${room.players.length >= 6 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : 'bg-gray-400 cursor-not-allowed'}`}
                >
                  Start Game
                </Button>
              ) : (
                <Button 
                  onClick={handleNewGame} 
                  className="w-full h-10 sm:h-12 text-base sm:text-lg font-medium bg-blue-600 hover:bg-blue-700
                           transition-colors"
                >
                  New Game (Shuffle Roles)
                </Button>
              )}

              <Button 
                onClick={handleExitGame} 
                variant="outline" 
                className="w-full h-10 sm:h-12 text-base sm:text-lg font-medium border-2"
              >
                Exit Game
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </Container>
  );
} 