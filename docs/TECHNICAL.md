# Mafia Game - Technical Documentation

## Overview
A real-time multiplayer implementation of Mafia using Next.js and Pusher WebSockets. This documentation covers setup, architecture, and key components.

## Setup

### Prerequisites 

Required dependencies
Node.js (v18+)
npm/yarn
Pusher account

### Environment Variables
Create a `.env.local` file:
```env
PUSHER_APP_ID=your_app_id
PUSHER_KEY=your_key
PUSHER_SECRET=your_secret
PUSHER_CLUSTER=your_cluster
```

## Installation
```bash
# Clone repository
git clone [repository-url]

# Install dependencies
npm install

# Run development server
npm run dev
```

## Architecture

### Core Components

1. **Room Management**
   ```typescript
   type Room = {
     code: string;
     status: 'waiting' | 'started' | 'ended';
     players: Player[];
     minPlayers: number;
     maxPlayers: number;
   };
   ```

2. **Player Structure**
   ```typescript
   type Player = {
     id: string;
     name: string;
     role: PlayerRole;
     isHost: boolean;
     isAlive: boolean;
   };
   ```

3. **Role Distribution**
   ```typescript
   type PlayerRole = 'mafia' | 'detective' | 'doctor' | 'villager' | 'unassigned';
   ```

### Game Setup Configurations
```typescript
const MAFIA_SETUPS = [
  {
    minPlayers: 6,
    maxPlayers: 8,
    mafia: 2,
    detective: 1,
    doctor: 1
  },
  // Additional configurations...
];
```

## API Endpoints

### POST /api/game
Handles all game-related events:

1. **Create Room**
   ```typescript
   {
     event: 'create-room',
     roomCode: string
   }
   ```

2. **Join Room**
   ```typescript
   {
     event: 'join-room',
     roomCode: string,
     data: {
       playerId: string,
       playerName: string
     }
   }
   ```

3. **Start Game**
   ```typescript
   {
     event: 'start-game',
     roomCode: string
   }
   ```

4. **Shuffle Roles**
   ```typescript
   {
     event: 'shuffle-roles',
     roomCode: string
   }
   ```

## Real-time Events

### Pusher Channels
- `game-${roomCode}`: Main game channel
- Events:
  - `player-joined`: New player joins
  - `game-started`: Game begins/roles assigned
  - `player-left`: Player disconnects

## Component Structure

```
src/
├── app/
│   ├── page.tsx            # Landing page
│   ├── game/              # Game interface
│   └── host/              # Host controls
├── components/
│   └── game/              # Game-specific components
├── lib/
│   └── pusher.ts          # Pusher configuration
├── types/
│   └── game.ts            # Type definitions
└── utils/
    └── roles.ts           # Role utilities
```

## Development Guidelines

1. **State Management**
   - Use React hooks for local state
   - Pusher for real-time updates
   - Local storage for persistence

2. **Error Handling**
   - Implement try-catch blocks
   - Provide user feedback
   - Log errors appropriately

3. **Testing**
   - Minimum 6 players required
   - Test role distribution
   - Verify real-time updates

## Known Limitations

1. In-memory storage (resets on server restart)
2. No persistent game history
3. Limited to single active game per room

## Future Improvements

1. Database integration
2. Authentication system
3. Game phases implementation
4. Chat functionality