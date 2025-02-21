'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Shield, Syringe, Skull } from 'lucide-react';
import type { GameRole } from '@/types/game';

export const MafiaSetup = () => {
  const [playerCount, setPlayerCount] = useState(8);
  const [currentCardIndex, setCurrentCardIndex] = useState(-1);
  const [showRoles, setShowRoles] = useState(false);
  const [roles, setRoles] = useState<GameRole[]>([]);

  // Calculate optimal role distribution based on player count
  const calculateRoles = (players: number) => {
    let roles: GameRole[] = [];
    
    // Calculate initial distribution
    const detectiveCount = players <= 8 ? 1 : (players <= 13 ? 2 : 3);
    const doctorCount = players <= 10 ? 1 : 2;
    let mafiaCount = Math.max(1, Math.round(players / 3));
    let villagerCount = players - detectiveCount - doctorCount - mafiaCount;
    
    // Ensure villager count is at least equal to mafia count
    if (villagerCount < mafiaCount) {
      const excess = mafiaCount - villagerCount;
      mafiaCount -= Math.ceil(excess / 2);
      villagerCount += Math.ceil(excess / 2);
    }
    
    // Add Detectives
    for (let i = 0; i < detectiveCount; i++) {
      roles.push({ role: 'Detective', icon: <Shield className="h-8 w-8" /> });
    }
    
    // Add Doctors
    for (let i = 0; i < doctorCount; i++) {
      roles.push({ role: 'Doctor', icon: <Syringe className="h-8 w-8" /> });
    }
    
    // Add Mafia
    for (let i = 0; i < mafiaCount; i++) {
      roles.push({ role: 'Mafia', icon: <Skull className="h-8 w-8" /> });
    }
    
    // Add Villagers
    for (let i = 0; i < villagerCount; i++) {
      roles.push({ role: 'Villager', icon: <Users className="h-8 w-8" /> });
    }
    
    // Shuffle roles
    return roles.sort(() => Math.random() - 0.5);
  };

  const handlePlayerCountChange = (increment: number) => {
    const newCount = playerCount + increment;
    if (newCount >= 6 && newCount <= 20) {
      setPlayerCount(newCount);
      setShowRoles(false);
      setCurrentCardIndex(-1);
    }
  };

  const startGame = () => {
    setRoles(calculateRoles(playerCount));
    setShowRoles(true);
    setCurrentCardIndex(-1);
  };

  const showNextCard = () => {
    if (currentCardIndex < playerCount - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
    }
  };

  const resetGame = () => {
    setShowRoles(false);
    setCurrentCardIndex(-1);
  };

  const getRoleDistribution = () => {
    const detectiveCount = playerCount <= 8 ? 1 : (playerCount <= 13 ? 2 : 3);
    const doctorCount = playerCount <= 10 ? 1 : 2;
    let mafiaCount = Math.max(1, Math.round(playerCount / 3));
    let villagerCount = playerCount - detectiveCount - doctorCount - mafiaCount;
    
    if (villagerCount < mafiaCount) {
      const excess = mafiaCount - villagerCount;
      mafiaCount -= Math.ceil(excess / 2);
      villagerCount += Math.ceil(excess / 2);
    }
    
    return {
      detectives: detectiveCount,
      doctors: doctorCount,
      mafia: mafiaCount,
      villagers: villagerCount
    };
  };

  const distribution = getRoleDistribution();

  return (
    <div className="w-full max-w-md mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-center">Mafia Game Setup</CardTitle>
        </CardHeader>
        <CardContent>
          {!showRoles ? (
            <div className="space-y-4">
              <div className="flex items-center justify-center space-x-4">
                <Button 
                  onClick={() => handlePlayerCountChange(-1)}
                  disabled={playerCount <= 6}
                >
                  -
                </Button>
                <span className="text-xl font-bold">{playerCount} Players</span>
                <Button 
                  onClick={() => handlePlayerCountChange(1)}
                  disabled={playerCount >= 20}
                >
                  +
                </Button>
              </div>
              <div className="text-sm space-y-1 mt-4">
                <p>Role Distribution:</p>
                <p>Detectives: {distribution.detectives}</p>
                <p>Doctors: {distribution.doctors}</p>
                <p>Mafia: {distribution.mafia}</p>
                <p>Villagers: {distribution.villagers}</p>
              </div>
              <div className="flex justify-center">
                <Button onClick={startGame} className="w-full">
                  Generate Roles
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {currentCardIndex === -1 ? (
                <div className="text-center">
                  <p className="mb-4">Roles have been generated!</p>
                  <Button onClick={showNextCard} className="w-full">
                    Start Revealing Roles
                  </Button>
                </div>
              ) : currentCardIndex < playerCount ? (
                <div className="text-center space-y-4">
                  <div className="p-8 border-2 border-dashed rounded-lg">
                    <div className="flex justify-center mb-2">
                      {roles[currentCardIndex].icon}
                    </div>
                    <h3 className="text-xl font-bold">
                      Player {currentCardIndex + 1} is:
                    </h3>
                    <p className="text-2xl font-bold mt-2">
                      {roles[currentCardIndex].role}
                    </p>
                  </div>
                  <Button 
                    onClick={showNextCard}
                    className="w-full"
                    disabled={currentCardIndex === playerCount - 1}
                  >
                    Next Player
                  </Button>
                </div>
              ) : null}
              <Button 
                onClick={resetGame} 
                variant="outline"
                className="w-full"
              >
                Reset Game
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
