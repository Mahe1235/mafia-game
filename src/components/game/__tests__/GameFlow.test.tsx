/**
 * Game Flow Test Suite
 * 
 * This test suite focuses on verifying the correct sequence of events during gameplay:
 * - Tests the transition from waiting room to game started state
 * - Validates player elimination sequences work correctly
 * - Ensures game ending scenarios are handled properly
 * - Tests host-related actions (starting game, ending game)
 * - Verifies WebSocket event handling for various game state changes
 * 
 * These tests ensure that the game progresses through its various states correctly
 * and that UI updates appropriately reflect the current game state.
 */

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { act } from 'react';
import '@testing-library/jest-dom';
import { GameRoom } from '../GameRoom';
import { pusherClient } from '@/lib/pusher';
import { useRouter, useSearchParams } from 'next/navigation';

// Mock modules
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn()
}));

// Mock Pusher
jest.mock('@/lib/pusher', () => {
  return {
    pusherClient: {
      subscribe: jest.fn(() => ({
        bind: jest.fn(),
        unbind_all: jest.fn(),
      })),
      unsubscribe: jest.fn(),
      connection: {
        bind: jest.fn()
      }
    }
  };
});

// Mock fetch
global.fetch = jest.fn();

// Mock storage
const mockLocalStorage = new Map();
const mockSessionStorage = new Map();

Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: (key: string) => mockLocalStorage.get(key),
    setItem: (key: string, value: string) => mockLocalStorage.set(key, value),
    clear: () => mockLocalStorage.clear(),
  },
});

Object.defineProperty(window, 'sessionStorage', {
  value: {
    getItem: (key: string) => mockSessionStorage.get(key),
    setItem: (key: string, value: string) => mockSessionStorage.set(key, value),
    clear: () => mockSessionStorage.clear(),
  },
});

describe('Game Flow', () => {
  const mockRouter = {
    push: jest.fn(),
    replace: jest.fn(),
  };

  const mockSearchParams = new URLSearchParams('?code=ABC123');
  const mockWaitingRoom = {
    code: 'ABC123',
    hostName: 'Host',
    players: [
      { id: '1', name: 'Player 1', isAlive: true },
      { id: '2', name: 'Player 2', isAlive: true },
      { id: '3', name: 'Player 3', isAlive: true },
      { id: '4', name: 'Player 4', isAlive: true },
      { id: '5', name: 'Player 5', isAlive: true },
      { id: '6', name: 'Player 6', isAlive: true },
    ],
    status: 'waiting',
    minPlayers: 6,
    maxPlayers: 15,
  };

  // Mock channel for testing Pusher events
  const mockChannel = {
    bind: jest.fn(),
    unbind_all: jest.fn(),
  };

  // Store event handlers for testing
  let eventHandlers: Record<string, Function> = {};

  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.clear();
    mockSessionStorage.clear();
    eventHandlers = {};
    
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);
    
    // Capture event handlers
    (pusherClient.subscribe as jest.Mock).mockReturnValue({
      bind: jest.fn((event, handler) => {
        eventHandlers[event] = handler;
      }),
      unbind_all: jest.fn(),
    });
  });

  it('follows correct sequence from waiting to started', async () => {
    // Setup
    mockLocalStorage.set('hostRoom', 'ABC123');
    
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockWaitingRoom),
      })
      .mockResolvedValueOnce({
        ok: true,
      });

    render(<GameRoom />);

    // Wait for initial render
    await waitFor(() => {
      expect(screen.getByText('God View')).toBeInTheDocument();
    });

    // Verify in waiting state
    expect(screen.getByText('Start Game')).toBeInTheDocument();
    
    // Click start game
    const startButton = screen.getByText('Start Game');
    await act(async () => {
      fireEvent.click(startButton);
    });
    
    // Verify API was called with game-started event
    expect(global.fetch).toHaveBeenLastCalledWith('/api/game', expect.objectContaining({
      method: 'POST',
      body: expect.stringContaining('game-started'),
    }));

    // Simulate game-started websocket event
    const playersWithRoles = mockWaitingRoom.players.map((p, i) => ({
      ...p,
      role: i < 2 ? 'mafia' : i < 3 ? 'detective' : i < 4 ? 'doctor' : 'villager'
    }));
    
    await act(async () => {
      eventHandlers['game-started'](playersWithRoles);
    });
    
    // Verify state has changed to started
    await waitFor(() => {
      expect(screen.getByText('Reassign Roles')).toBeInTheDocument();
    });
  });

  it('handles player elimination sequence', async () => {
    // Setup for host
    mockLocalStorage.set('hostRoom', 'ABC123');
    
    const startedRoom = {
      ...mockWaitingRoom,
      status: 'started',
      players: mockWaitingRoom.players.map((p, i) => ({
        ...p,
        role: i < 2 ? 'mafia' : i < 3 ? 'detective' : i < 4 ? 'doctor' : 'villager'
      })),
    };
    
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(startedRoom),
      })
      .mockResolvedValueOnce({
        ok: true,
      });

    render(<GameRoom />);

    // Wait for initial render in started state
    await waitFor(() => {
      expect(screen.getByText('God View')).toBeInTheDocument();
      expect(screen.getAllByText(/Player \d/)).toHaveLength(6);
    });
    
    // Find eliminate buttons
    const eliminateButtons = screen.getAllByRole('button', { name: /Eliminate/i });
    expect(eliminateButtons).toHaveLength(6);
    
    // Eliminate a player
    await act(async () => {
      fireEvent.click(eliminateButtons[0]);
    });
    
    // Verify API was called with player-eliminated event
    expect(global.fetch).toHaveBeenLastCalledWith('/api/game', expect.objectContaining({
      method: 'POST',
      body: expect.stringContaining('player-eliminated'),
    }));

    // Simulate the WebSocket event
    await act(async () => {
      eventHandlers['player-eliminated']('1');
    });
    
    // Verify player is marked as eliminated
    const player1Element = screen.getByText(/Player 1/).closest('div');
    expect(player1Element).toHaveClass('bg-red-50', 'text-red-800', 'line-through', 'opacity-75');
    
    // Verify (Dead) text is shown
    expect(screen.getByText(/\(Dead\)/)).toBeInTheDocument();
  });

  it('handles game end', async () => {
    // Setup
    mockLocalStorage.set('hostRoom', 'ABC123');
    
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockWaitingRoom),
      })
      .mockResolvedValueOnce({
        ok: true,
      });

    render(<GameRoom />);

    // Wait for initial render
    await waitFor(() => {
      expect(screen.getByText('God View')).toBeInTheDocument();
    });

    // Click end game
    const endButton = screen.getByText('End Game');
    await act(async () => {
      fireEvent.click(endButton);
    });
    
    // Verify API was called with game-ended event
    expect(global.fetch).toHaveBeenLastCalledWith('/api/game', expect.objectContaining({
      method: 'POST',
      body: expect.stringContaining('game-ended'),
    }));

    // Verify redirect
    expect(mockRouter.replace).toHaveBeenCalledWith('/');
  });

  it('handles host leaving during game', async () => {
    // Setup for a player
    mockSessionStorage.set('playerSession', JSON.stringify({
      id: '1',
      name: 'Player 1',
      roomCode: 'ABC123'
    }));
    
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockWaitingRoom),
    });

    render(<GameRoom />);

    // Wait for initial render
    await waitFor(() => {
      expect(screen.getByText('Player View')).toBeInTheDocument();
    });

    // Simulate host leaving (game-ended event)
    await act(async () => {
      eventHandlers['game-ended']({ reason: 'host-left' });
    });
    
    // Verify redirect to home
    expect(mockRouter.replace).toHaveBeenCalledWith('/');
  });
}); 