'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { GameStore } from '@/utils/gameStore';
import { RoleIcons, RoleColors, RoleDescriptions } from '@/utils/roles';
import type { Role, Player, GameStatus } from '@/types/game';

export default function GamePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [playerInfo, setPlayerInfo] = useState<{
    id: string;
    name: string;
    roomCode: string;
    role?: Role;
  } | null>(null);
  const [room, setRoom] = useState<{
    code: string;
    hostName: string;
    players: Player[];
    status: GameStatus;
  } | null>(null);

  useEffect(() => {
    const code = searchParams.get('code');
    const storedInfo = localStorage.getItem('playerInfo');
    
    if (!code || !storedInfo) {
      router.push('/');
      return;
    }

    const parsedInfo = JSON.parse(storedInfo);
    if (parsedInfo.roomCode !== code) {
      router.push('/');
      return;
    }

    // Validate and reconnect player
    if (!GameStore.validateSession(code, parsedInfo.id)) {
      localStorage.removeItem('playerInfo');
      router.push('/?error=session-expired');
      return;
    }

    const reconnectedPlayer = GameStore.reconnectPlayer(code, parsedInfo.id);
    if (!reconnectedPlayer) {
      localStorage.removeItem('playerInfo');
      router.push('/?error=connection-lost');
      return;
    }

    // Update player info with any changes (like role) from reconnection
    const updatedInfo = { ...parsedInfo, ...reconnectedPlayer };
    setPlayerInfo(updatedInfo);
    localStorage.setItem('playerInfo', JSON.stringify(updatedInfo));

    const gameRoom = GameStore.getRoom(code);
    if (!gameRoom) {
      localStorage.removeItem('playerInfo');
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
        const updatedPlayer = players.find(p => p.id === parsedInfo.id);
        if (updatedPlayer?.role) {
          const updatedInfo = { ...parsedInfo, role: updatedPlayer.role };
          setPlayerInfo(updatedInfo);
          localStorage.setItem('playerInfo', JSON.stringify(updatedInfo));
        }
        
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
        const updatedInfo = { ...parsedInfo };
        delete updatedInfo.role;
        setPlayerInfo(updatedInfo);
        localStorage.setItem('playerInfo', JSON.stringify(updatedInfo));
        
        setRoom(currentRoom => {
          if (!currentRoom) return null;
          return {
            ...currentRoom,
            status: 'waiting',
            players: currentRoom.players.map(({ id, name }) => ({ id, name }))
          };
        });
      },
      onGameEnded: ({ reason }) => {
        if (reason === 'host-left') {
          localStorage.removeItem('playerInfo');
          router.push('/?error=host-left');
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [searchParams, router]);

  const handleLeaveGame = async () => {
    if (playerInfo) {
      await GameStore.leaveRoom(playerInfo.roomCode, playerInfo.id);
      localStorage.removeItem('playerInfo');
    }
    router.push('/');
  };

  if (!playerInfo || !room) {
    return <div>Loading...</div>;
  }

  return (
    <Container>
      <div className="text-center space-y-2 sm:space-y-3">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Mafia Game</h1>
        <div className="inline-block px-4 sm:px-6 py-1.5 sm:py-2 bg-white rounded-full shadow-sm">
          <p className="text-base sm:text-lg font-mono tracking-widest text-gray-900">
            Room: {playerInfo.roomCode}
          </p>
        </div>
      </div>

      <Card className="shadow-lg">
        <CardContent className="p-4 sm:p-6">
          <div className="space-y-4 sm:space-y-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-center text-lg sm:text-xl mb-2 text-gray-900">
                Welcome, {playerInfo.name}!
              </h3>
              
              {playerInfo.role ? (
                <div className="space-y-4">
                  <div className="p-4 sm:p-6 bg-white rounded-lg shadow-inner text-center">
                    <p className="text-base sm:text-lg font-medium text-gray-600 mb-3">Your Role:</p>
                    <div className={`space-y-2 ${RoleColors[playerInfo.role]}`}>
                      <div className="flex items-center justify-center gap-3">
                        <span className="text-3xl sm:text-4xl">{RoleIcons[playerInfo.role]}</span>
                        <span className="text-2xl sm:text-3xl font-bold">{playerInfo.role}</span>
                      </div>
                      <p className="text-sm sm:text-base italic text-gray-600 mt-2">
                        &quot;{RoleDescriptions[playerInfo.role]}&quot;
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-center text-gray-600 font-medium">
                    Keep your role secret from other players!
                  </p>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-600 animate-pulse">
                    Waiting for host to start the game...
                  </p>
                </div>
              )}
            </div>

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
                    className={`flex items-center justify-between p-2.5 bg-white rounded-lg shadow-sm
                              ${player.id === playerInfo.id ? 'ring-2 ring-blue-500' : ''}`}
                  >
                    <span className="font-medium text-gray-900">
                      {player.name} {player.id === playerInfo.id && '(You)'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <Button 
              onClick={handleLeaveGame}
              variant="outline" 
              className="w-full h-10 sm:h-12 text-base sm:text-lg font-medium border-2"
            >
              Leave Game
            </Button>
          </div>
        </CardContent>
      </Card>
    </Container>
  );
} 