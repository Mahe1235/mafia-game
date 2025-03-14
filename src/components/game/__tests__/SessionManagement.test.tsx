/**
 * Tests for session management and authentication flows
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { act } from 'react';
import '@testing-library/jest-dom';
import { GameRoom } from '../GameRoom';
import { useRouter, useSearchParams } from 'next/navigation';

// Mock modules first before importing anything that depends on them
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
global.fetch = jest.fn(() => 
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
  } as Response)
);

// Mock storage
const mockLocalStorage = new Map();
const mockSessionStorage = new Map();

Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: (key: string) => mockLocalStorage.get(key),
    setItem: (key: string, value: string) => mockLocalStorage.set(key, value),
    clear: () => mockLocalStorage.clear(),
    removeItem: (key: string) => mockLocalStorage.delete(key),
  },
});

Object.defineProperty(window, 'sessionStorage', {
  value: {
    getItem: (key: string) => mockSessionStorage.get(key),
    setItem: (key: string, value: string) => mockSessionStorage.set(key, value),
    clear: () => mockSessionStorage.clear(),
    removeItem: (key: string) => mockSessionStorage.delete(key),
  },
});

describe('Session Management', () => {
  const mockRouter = {
    push: jest.fn(),
    replace: jest.fn(),
  };

  const mockSearchParams = new URLSearchParams('?code=ABC123');
  const mockRoom = {
    code: 'ABC123',
    hostName: 'Host',
    players: [
      { id: '1', name: 'Player 1', role: 'villager', isAlive: true },
      { id: '2', name: 'Player 2', role: 'mafia', isAlive: true },
    ],
    status: 'waiting',
    minPlayers: 6,
    maxPlayers: 15,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.clear();
    mockSessionStorage.clear();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);
  });

  it('redirects when no room code is provided', async () => {
    (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams());
    
    await act(async () => {
      render(<GameRoom />);
    });
    
    expect(mockRouter.replace).toHaveBeenCalledWith('/?error=invalid-code');
  });

  it('redirects when room is not found', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
    });

    await act(async () => {
      render(<GameRoom />);
    });

    expect(mockRouter.replace).toHaveBeenCalledWith('/?error=room-not-found');
  });

  it('shows host view when host session is valid', async () => {
    mockLocalStorage.set('hostRoom', 'ABC123');
    
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockRoom),
    });

    await act(async () => {
      render(<GameRoom />);
    });

    await waitFor(() => {
      expect(screen.getByText('God View')).toBeInTheDocument();
    });
  });

  it('shows player view when player session is valid', async () => {
    mockSessionStorage.set('playerSession', JSON.stringify({
      id: '1',
      name: 'Player 1',
      roomCode: 'ABC123'
    }));
    
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockRoom),
    });

    await act(async () => {
      render(<GameRoom />);
    });

    await waitFor(() => {
      expect(screen.getByText('Player View')).toBeInTheDocument();
    });
  });

  it('shows correct player role when game has started', async () => {
    mockSessionStorage.set('playerSession', JSON.stringify({
      id: '1',
      name: 'Player 1',
      roomCode: 'ABC123'
    }));
    
    const startedRoom = {
      ...mockRoom,
      status: 'started',
      players: [
        { id: '1', name: 'Player 1', role: 'detective', isAlive: true },
        { id: '2', name: 'Player 2', role: 'mafia', isAlive: true },
      ]
    };
    
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(startedRoom),
    });

    await act(async () => {
      render(<GameRoom />);
    });

    await waitFor(() => {
      expect(screen.getByText(/Your Role: Detective/)).toBeInTheDocument();
    });
  });
}); 