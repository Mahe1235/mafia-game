import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { pusher } from '@/lib/pusher';
import { rateLimit } from '@/lib/rateLimiter';

export async function POST(req: Request) {
  try {
    // Get IP for rate limiting
    const forwardedFor = (await headers()).get('x-forwarded-for');
    const ip = forwardedFor ? forwardedFor.split(',')[0] : 'localhost';

    // Check rate limit (10 requests per second)
    const rateLimitResult = await rateLimit(ip, 10);
    if (rateLimitResult) return rateLimitResult;

    const { roomCode, event, data } = await req.json();
    
    // Trigger event to specific room channel
    await pusher.trigger(`game-${roomCode}`, event, data);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Game event error:', error);
    return NextResponse.json(
      { error: 'Failed to send game event' }, 
      { status: 500 }
    );
  }
} 