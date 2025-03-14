/**
 * Tests for GameRoom component
 */
import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { act } from 'react';
import '@testing-library/jest-dom';
import { GameRoom } from '../GameRoom';
import { pusherClient } from '@/lib/pusher';
import { useRouter, useSearchParams } from 'next/navigation';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn()
}));

// Mock Pusher
jest.mock('@/lib/pusher', () => ({
  pusherClient: {
    subscribe: jest.fn(() => ({
      bind: jest.fn(),
      unbind_all: jest.fn(),
    })),
    unsubscribe: jest.fn(),
  },
}));

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

// Helper function to wait for component updates
const waitForComponentUpdate = () => new Promise(resolve => setTimeout(resolve, 0));

describe('GameRoom', () => {
  const mockRouter = {
    push: jest.fn(),
    replace: jest.fn(),
  };

  const mockSearchParams = new URLSearchParams('?code=ABC123');

  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.clear();
    mockSessionStorage.clear();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);
  });

  it('renders loading state initially', async () => {
    (global.fetch as jest.Mock).mockImplementationOnce(() => 
      new Promise(resolve => setTimeout(resolve, 100))
    );
    
    render(<GameRoom />);
    expect(screen.getByText('Loading game...')).toBeInTheDocument();
  });

  it('redirects if no room code is provided', async () => {
    (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams());
    await act(async () => {
      render(<GameRoom />);
    });
    expect(mockRouter.replace).toHaveBeenCalledWith('/?error=invalid-code');
  });

  it('shows error if room is not found', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
    });

    await act(async () => {
      render(<GameRoom />);
    });

    await waitFor(() => {
      expect(screen.getByText('Game not found')).toBeInTheDocument();
    });
  });

  describe('God View', () => {
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

    beforeEach(() => {
      mockLocalStorage.set('hostRoom', 'ABC123');
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockRoom),
      });
    });

    it('shows God view when user is host', async () => {
      await act(async () => {
        render(<GameRoom />);
        await waitForComponentUpdate();
      });

      expect(screen.getByText('God View')).toBeInTheDocument();
    });

    it('shows role icons for all players in God view', async () => {
      await act(async () => {
        render(<GameRoom />);
        await waitForComponentUpdate();
      });

      const playerElements = screen.getAllByText(/Player [12]/);
      expect(playerElements).toHaveLength(2);
      const villagerIcon = screen.getAllByText('🏘️')[0];
      const mafiaIcon = screen.getByText('🔪');
      expect(villagerIcon).toBeInTheDocument();
      expect(mafiaIcon).toBeInTheDocument();
    });

    it('allows eliminating players', async () => {
      render(<GameRoom />);

      // Wait for the game state to be fully loaded
      await waitFor(() => {
        expect(screen.getByText('God View')).toBeInTheDocument();
      });

      // Now check for eliminate buttons
      const eliminateButtons = await screen.findAllByRole('button', { name: /Eliminate/i });
      expect(eliminateButtons).toHaveLength(2);

      await act(async () => {
        fireEvent.click(eliminateButtons[0]);
      });

      expect(global.fetch).toHaveBeenLastCalledWith('/api/game', expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('player-eliminated'),
      }));
    });
  });

  describe('Player View', () => {
    const mockRoom = {
      code: 'ABC123',
      hostName: 'Host',
      players: [
        { id: '1', name: 'Player 1', role: 'villager', isAlive: false },
        { id: '2', name: 'Player 2', role: 'mafia', isAlive: true },
      ],
      status: 'started',
      minPlayers: 6,
      maxPlayers: 15,
    };

    beforeEach(() => {
      mockLocalStorage.clear(); // Clear host status
      mockSessionStorage.set('playerSession', JSON.stringify({
        id: '1',
        name: 'Player 1',
        roomCode: 'ABC123',
      }));
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockRoom),
      });
    });

    it('shows Player view when user is not host', async () => {
      await act(async () => {
        render(<GameRoom />);
        await waitForComponentUpdate();
      });

      expect(screen.getByText('Player View')).toBeInTheDocument();
    });

    it('shows player\'s own role when game has started', async () => {
      await act(async () => {
        render(<GameRoom />);
        await waitForComponentUpdate();
      });

      const roleHeading = screen.getByText(/Your Role: Villager/);
      const roleIcon = within(roleHeading).getByText('🏘️');
      expect(roleHeading).toBeInTheDocument();
      expect(roleIcon).toBeInTheDocument();
    });

    it('marks eliminated players correctly', async () => {
      await act(async () => {
        render(<GameRoom />);
      });

      // Wait for the game state to be fully loaded
      await waitFor(() => {
        expect(screen.getByText('Player View')).toBeInTheDocument();
      });

      // Find the player container using data-testid
      const player1Container = screen.getByTestId('player-1');
      
      // Verify the container has the eliminated player classes
      expect(player1Container).toHaveClass('bg-red-50', 'text-red-800', 'line-through', 'opacity-75');
      
      // Verify the player name and status are shown
      expect(screen.getByText(/Player 1/)).toBeInTheDocument();
      expect(screen.getByText(/\(Dead\)/)).toBeInTheDocument();
    });
  });

  describe('Game Updates', () => {
    let mockChannel: { bind: jest.Mock; unbind_all: jest.Mock };
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

    beforeEach(() => {
      mockChannel = {
        bind: jest.fn(),
        unbind_all: jest.fn(),
      };
      (pusherClient.subscribe as jest.Mock).mockReturnValue(mockChannel);
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockRoom),
      });
    });

    it('handles player elimination updates', async () => {
      await act(async () => {
        render(<GameRoom />);
        await waitForComponentUpdate();
      });
      
      await act(async () => {
        const [, callback] = mockChannel.bind.mock.calls.find(
          ([evt]) => evt === 'player-eliminated'
        );
        callback('1');
        await waitForComponentUpdate();
      });

      const playerElement = screen.getByText(/Player 1/).closest('div[class*="p-2 rounded-md"]');
      expect(playerElement).toHaveClass('bg-red-50');
      expect(playerElement).toHaveClass('line-through');
    });

    it('handles game end', async () => {
      await act(async () => {
        render(<GameRoom />);
        await waitForComponentUpdate();
      });
      
      await act(async () => {
        const [, callback] = mockChannel.bind.mock.calls.find(
          ([evt]) => evt === 'game-ended'
        );
        callback();
      });

      expect(mockRouter.replace).toHaveBeenCalledWith('/');
    });
  });

  describe('Player elimination', () => {
    const mockRoomWithEliminated = {
      code: 'ABC123',
      hostName: 'Host',
      players: [
        { id: '1', name: 'Player 1', role: 'villager', isAlive: false },
        { id: '2', name: 'Player 2', role: 'mafia', isAlive: true },
      ],
      status: 'started',
      minPlayers: 6,
      maxPlayers: 15,
    };

    beforeEach(() => {
      // Clear host status and set up player session instead
      mockLocalStorage.clear();
      mockSessionStorage.set('playerSession', JSON.stringify({
        id: '1',
        name: 'Player 1',
        roomCode: 'ABC123',
      }));
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockRoomWithEliminated),
      });
    });

    it('marks eliminated players correctly', async () => {
      await act(async () => {
        render(<GameRoom />);
      });

      // Wait for the game state to be fully loaded
      await waitFor(() => {
        expect(screen.getByText('Player View')).toBeInTheDocument();
      });

      // Find the player container using data-testid
      const player1Container = screen.getByTestId('player-1');
      
      // Verify the container has the eliminated player classes
      expect(player1Container).toHaveClass('bg-red-50', 'text-red-800', 'line-through', 'opacity-75');
      
      // Verify the player name and status are shown
      expect(screen.getByText(/Player 1/)).toBeInTheDocument();
      expect(screen.getByText(/\(Dead\)/)).toBeInTheDocument();
    });

    it('hides eliminate button for eliminated players', async () => {
      // Set up host view for this test
      mockLocalStorage.set('hostRoom', 'ABC123');
      mockSessionStorage.clear();

      render(<GameRoom />);

      // Wait for the game state to be fully loaded
      await waitFor(() => {
        expect(screen.getByText('God View')).toBeInTheDocument();
      });

      // Check eliminate buttons
      const eliminateButtons = screen.getAllByRole('button', { name: /Eliminate/i });
      expect(eliminateButtons).toHaveLength(1); // Only one button for alive player

      // Verify button placement
      const player2Container = screen.getByTestId('player-2');
      expect(within(player2Container).getByRole('button', { name: /Eliminate/i })).toBeInTheDocument();

      const player1Container = screen.getByTestId('player-1');
      expect(within(player1Container).queryByRole('button', { name: /Eliminate/i })).not.toBeInTheDocument();
    });

    it('updates UI immediately after elimination', async () => {
      // Set up host view for this test
      mockLocalStorage.set('hostRoom', 'ABC123');
      mockSessionStorage.clear();

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            ...mockRoomWithEliminated,
            players: [
              { id: '1', name: 'Player 1', role: 'villager', isAlive: true },
              { id: '2', name: 'Player 2', role: 'mafia', isAlive: true },
            ],
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
        });

      render(<GameRoom />);

      await waitFor(() => {
        expect(screen.getByText('God View')).toBeInTheDocument();
      });

      const eliminateButton = screen.getAllByRole('button', { name: /Eliminate/i })[0];
      
      await act(async () => {
        fireEvent.click(eliminateButton);
      });

      const playerElement = screen.getByTestId('player-1');
      expect(playerElement).toHaveClass('bg-red-50', 'text-red-800', 'line-through', 'opacity-75');
    });
  });
}); 