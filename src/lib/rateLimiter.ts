import { RateLimiter } from 'limiter';
import { NextResponse } from 'next/server';

// Create a map to store limiters for different IPs
const limiters = new Map<string, RateLimiter>();

export async function rateLimit(ip: string, limit: number = 10) { // 10 requests per second by default
  // Get or create limiter for this IP
  if (!limiters.has(ip)) {
    limiters.set(ip, new RateLimiter({
      tokensPerInterval: limit,
      interval: "second",
      fireImmediately: true
    }));
  }

  const limiter = limiters.get(ip)!;
  const hasToken = await limiter.tryRemoveTokens(1);

  if (!hasToken) {
    return NextResponse.json(
      { error: 'Too many requests, please try again later.' },
      { status: 429 }
    );
  }

  return null;
} 