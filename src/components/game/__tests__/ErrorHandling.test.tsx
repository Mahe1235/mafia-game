/**
 * Error Handling & Edge Cases Test Suite
 * 
 * This test suite focuses on validating the application's resilience to various error conditions:
 * - Network errors when fetching room data
 * - Server errors (500, 404, etc.)
 * - Malformed or incomplete API responses
 * - WebSocket connection failures
 * - API errors during game actions
 * 
 * The tests ensure that the application:
 * 1. Degrades gracefully when errors occur
 * 2. Displays appropriate error messages to users
 * 3. Logs errors for debugging
 * 4. Maintains application stability without crashing
 * 5. Redirects users when appropriate
 * 
 * These tests are critical for ensuring a robust user experience even when
 * unexpected conditions occur.
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

// Mock console to capture errors
const originalConsoleError = console.error;
const mockConsoleError = jest.fn();

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

describe('Error Handling & Edge Cases', () => {
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

  // Mock channel for testing Pusher events
  const mockChannel = {
    bind: jest.fn(),
    unbind_all: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.clear();
    mockSessionStorage.clear();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);
    (pusherClient.subscribe as jest.Mock).mockReturnValue(mockChannel);
    console.error = mockConsoleError;
  });

  afterAll(() => {
    console.error = originalConsoleError;
  });

  it('handles network errors when fetching room data', async () => {
    // Simulate a network error
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    await act(async () => {
      render(<GameRoom />);
    });

    // Should redirect to error page
    expect(mockRouter.replace).toHaveBeenCalledWith('/?error=room-not-found');
    expect(mockConsoleError).toHaveBeenCalled();
  });

  it('handles server errors when fetching room data', async () => {
    // Simulate a server error
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error'
    });

    await act(async () => {
      render(<GameRoom />);
    });

    // Should redirect to error page
    expect(mockRouter.replace).toHaveBeenCalledWith('/?error=room-not-found');
  });

  it('handles malformed response data gracefully', async () => {
    // Simulate malformed JSON response with incomplete data
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ 
        // Minimal valid data
        code: 'ABC123',
        hostName: 'Host',
        status: 'waiting',
        // No players array
      })
    });

    await act(async () => {
      render(<GameRoom />);
    });

    // Component should render a fallback message
    await waitFor(() => {
      expect(screen.getByText(/No players available/i)).toBeInTheDocument();
    });
  });

  it('handles WebSocket connection errors', async () => {
    // Set up the component with successful initial load
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockRoom)
    });

    // Mock the connection error handling
    let connectionErrorHandler: Function;
    (pusherClient.connection.bind as jest.Mock).mockImplementation((event, handler) => {
      if (event === 'error') {
        connectionErrorHandler = handler;
      }
    });

    render(<GameRoom />);

    // Wait for loading to complete first
    await waitFor(() => {
      expect(screen.queryByText('Loading game...')).not.toBeInTheDocument();
    });

    // Make sure we can see the player data
    expect(screen.getByText(/Players/i)).toBeInTheDocument();

    // Simulate connection error
    act(() => {
      connectionErrorHandler(new Error('Connection failed'));
    });

    // Should log the error but not crash
    expect(mockConsoleError).toHaveBeenCalled();
    
    // The component should still be functional (not crashed)
    // Verify it's still showing the Players heading
    expect(screen.getByText(/Players/i)).toBeInTheDocument();
  });

  it('handles API errors when taking game actions', async () => {
    // Setup
    mockLocalStorage.set('hostRoom', 'ABC123');
    
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          ...mockRoom,
          status: 'started',
        }),
      })
      .mockRejectedValueOnce(new Error('Failed to eliminate player'));

    render(<GameRoom />);

    await waitFor(() => {
      expect(screen.getByText('God View')).toBeInTheDocument();
    });

    // Find an eliminate button
    const eliminateButton = await screen.findAllByRole('button', { name: /Eliminate/i });
    
    // Click the button to trigger the API call
    await act(async () => {
      fireEvent.click(eliminateButton[0]);
    });

    // Should log the error but not crash
    expect(mockConsoleError).toHaveBeenCalled();
    // Component should still be rendered
    expect(screen.getByText('God View')).toBeInTheDocument();
  });
}); 