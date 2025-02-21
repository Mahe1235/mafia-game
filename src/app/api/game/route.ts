import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { pusher } from '@/lib/pusher';
import { rateLimit } from '@/lib/rateLimiter';

// In-memory storage (will reset on server restart)
const rooms = new Map();

// Game constants
const MIN_PLAYERS = 6;
const MAX_PLAYERS = 15;

export async function POST(req: Request) {
  try {
    const { roomCode, event, data } = await req.json();
    const headersList = await headers();
    const ip = headersList.get('x-forwarded-for') || 'unknown';
    
    const rateLimitResponse = await rateLimit(ip);
    if (rateLimitResponse) {  // If response exists, rate limit was exceeded
      return rateLimitResponse;
    }

    switch (event) {
      case 'room-created':
        rooms.set(roomCode, {
          code: roomCode,
          hostName: data.hostName,
          players: [],
          status: 'waiting',
          minPlayers: MIN_PLAYERS,
          maxPlayers: MAX_PLAYERS
        });
        break;

      case 'player-joined':
        const room = rooms.get(roomCode);
        if (!room) {
          return new NextResponse('Room not found', { status: 404 });
        }

        if (room.players.length >= MAX_PLAYERS) {
          return new NextResponse('Room is full', { status: 400 });
        }

        const newPlayer = {
          id: Math.random().toString(36).substring(2, 15),
          name: data.name,
          role: 'unassigned'
        };

        room.players.push(newPlayer);
        rooms.set(roomCode, room);

        // Notify others via Pusher
        await pusher.trigger(`game-${roomCode}`, 'player-joined', newPlayer);
        return NextResponse.json(newPlayer);

      case 'game-started':
        const startingRoom = rooms.get(roomCode);
        if (!startingRoom) {
          return new NextResponse('Room not found', { status: 404 });
        }

        if (startingRoom.players.length < MIN_PLAYERS) {
          return new NextResponse(`Need at least ${MIN_PLAYERS} players to start`, { status: 400 });
        }

        startingRoom.status = 'started';
        rooms.set(roomCode, startingRoom);

        // Notify others via Pusher
        await pusher.trigger(`game-${roomCode}`, 'game-started', startingRoom.players);
        break;

      case 'game-ended':
        await pusher.trigger(`game-${roomCode}`, 'game-ended', data);
        rooms.delete(roomCode);
        break;

      default:
        return new NextResponse('Invalid event', { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Game API error:', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    
    if (!code) {
      return new NextResponse('Room code required', { status: 400 });
    }

    const room = rooms.get(code);
    if (!room) {
      return new NextResponse('Room not found', { status: 404 });
    }

    return NextResponse.json(room);
  } catch (error) {
    console.error('Game API error:', error);
    return new NextResponse('Internal error', { status: 500 });
  }
} 