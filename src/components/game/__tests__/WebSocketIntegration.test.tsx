/**
 * WebSocket integration tests for GameRoom component
 * Tests the Pusher event handling functionality
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { act } from 'react';
import '@testing-library/jest-dom';
import { useRouter, useSearchParams } from 'next/navigation';

// Mock modules first before importing anything that depends on them
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn()
}));

// Mock Pusher at the module level
jest.mock('@/lib/pusher', () => {
  return {
    pusherClient: {
      subscribe: jest.fn(),
      unsubscribe: jest.fn(),
      connection: {
        bind: jest.fn()
      }
    }
  };
});

// Now import the component and mocked modules
import { GameRoom } from '../GameRoom';
import { pusherClient } from '@/lib/pusher';

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
  },
});

Object.defineProperty(window, 'sessionStorage', {
  value: {
    getItem: (key: string) => mockSessionStorage.get(key),
    setItem: (key: string, value: string) => mockSessionStorage.set(key, value),
    clear: () => mockSessionStorage.clear(),
  },
});

describe('WebSocket Integration', () => {
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
    status: 'started',
    minPlayers: 6,
    maxPlayers: 15,
  };

  // Storage for event callbacks
  const mockChannelBinds: Record<string, Function> = {};
  
  // Create mock channel
  const mockChannel = {
    bind: jest.fn((event, callback) => {
      mockChannelBinds[event] = callback;
    }),
    unbind_all: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.clear();
    mockSessionStorage.clear();
    
    // Reset our mocks for each test
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);
    (pusherClient.subscribe as jest.Mock).mockReturnValue(mockChannel);
    
    // Mock the fetch response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockRoom),
    });
  });

  it('subscribes to the correct channel when mounted', async () => {
    render(<GameRoom />);
    
    await waitFor(() => {
      expect(pusherClient.subscribe).toHaveBeenCalledWith('game-ABC123');
    });
  });

  it('binds to all required events', async () => {
    render(<GameRoom />);
    
    await waitFor(() => {
      // Wait for the component to be fully rendered
      expect(mockChannel.bind).toHaveBeenCalled();
    });
    
    // Check that all required events are bound
    expect(mockChannel.bind).toHaveBeenCalledWith('player-joined', expect.any(Function));
    expect(mockChannel.bind).toHaveBeenCalledWith('game-started', expect.any(Function));
    expect(mockChannel.bind).toHaveBeenCalledWith('player-eliminated', expect.any(Function));
    expect(mockChannel.bind).toHaveBeenCalledWith('player-left', expect.any(Function));
    expect(mockChannel.bind).toHaveBeenCalledWith('game-ended', expect.any(Function));
    expect(mockChannel.bind).toHaveBeenCalledWith('game-reset', expect.any(Function));
  });

  it('handles player-joined event correctly', async () => {
    render(<GameRoom />);
    
    await waitFor(() => {
      expect(screen.getByText(/Player 1/)).toBeInTheDocument();
    });
    
    // Get the player-joined callback that was registered
    const playerJoinedCallback = mockChannel.bind.mock.calls.find(
      call => call[0] === 'player-joined'
    )?.[1];
    
    if (!playerJoinedCallback) {
      throw new Error('player-joined callback not found');
    }
    
    // Trigger player-joined event
    act(() => {
      playerJoinedCallback({ id: '3', name: 'Player 3', role: 'villager', isAlive: true });
    });
    
    await waitFor(() => {
      expect(screen.getByText(/Player 3/)).toBeInTheDocument();
    });
  });

  it('handles player-eliminated event correctly', async () => {
    render(<GameRoom />);
    
    await waitFor(() => {
      expect(screen.getByText(/Player 1/)).toBeInTheDocument();
    });
    
    // Get the player-eliminated callback
    const playerEliminatedCallback = mockChannel.bind.mock.calls.find(
      call => call[0] === 'player-eliminated'
    )?.[1];
    
    if (!playerEliminatedCallback) {
      throw new Error('player-eliminated callback not found');
    }
    
    // Trigger player-eliminated event
    act(() => {
      playerEliminatedCallback('1');
    });
    
    // Check that the player's UI reflects elimination
    const playerElement = screen.getByTestId('player-1');
    expect(playerElement).toHaveClass('bg-red-50', 'text-red-800', 'line-through', 'opacity-75');
  });

  it('handles game-ended event correctly', async () => {
    render(<GameRoom />);
    
    await waitFor(() => {
      expect(mockChannel.bind).toHaveBeenCalledWith('game-ended', expect.any(Function));
    });
    
    // Get the game-ended callback
    const gameEndedCallback = mockChannel.bind.mock.calls.find(
      call => call[0] === 'game-ended'
    )?.[1];
    
    if (!gameEndedCallback) {
      throw new Error('game-ended callback not found');
    }
    
    // Trigger game-ended event
    act(() => {
      gameEndedCallback();
    });
    
    expect(mockRouter.replace).toHaveBeenCalledWith('/');
  });

  it('handles connection errors', async () => {
    console.error = jest.fn(); // Mock console.error
    
    render(<GameRoom />);
    
    await waitFor(() => {
      expect(pusherClient.connection.bind).toHaveBeenCalledWith('error', expect.any(Function));
    });
  });

  it('cleans up subscriptions on unmount', async () => {
    const { unmount } = render(<GameRoom />);
    
    await waitFor(() => {
      expect(pusherClient.subscribe).toHaveBeenCalled();
    });
    
    unmount();
    
    expect(mockChannel.unbind_all).toHaveBeenCalled();
    expect(pusherClient.unsubscribe).toHaveBeenCalledWith('game-ABC123');
  });
}); 