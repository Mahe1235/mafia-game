import Pusher from 'pusher';
import PusherClient from 'pusher-js';
import { logger } from '@/utils/logger';

// Server-side Pusher instance
export const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID || '',
  key: process.env.NEXT_PUBLIC_PUSHER_APP_KEY || '',
  secret: process.env.PUSHER_APP_SECRET || '',
  cluster: process.env.NEXT_PUBLIC_PUSHER_APP_CLUSTER || '',
  useTLS: true,
});

// Enhanced client-side Pusher instance with better error handling
const createPusherClient = () => {
  const client = new PusherClient(
    process.env.NEXT_PUBLIC_PUSHER_APP_KEY || '',
    {
      cluster: process.env.NEXT_PUBLIC_PUSHER_APP_CLUSTER || '',
      forceTLS: true,
      enabledTransports: ['ws', 'wss'],
      // Add reconnection exponential backoff
      activityTimeout: 30000, // 30s
      pongTimeout: 15000, // 15s
      // Increased timeouts for more resilience
      timeout: 20000,
    }
  );

  // Add global connection logging and error handling
  client.connection.bind('error', (err: any) => {
    logger.error('Pusher connection error:', err);
  });

  client.connection.bind('connected', () => {
    logger.info('Pusher connected successfully');
  });

  client.connection.bind('disconnected', () => {
    logger.warn('Pusher disconnected');
  });

  client.connection.bind('connecting', () => {
    logger.info('Pusher connecting...');
  });

  client.connection.bind('reconnecting', () => {
    logger.warn('Pusher reconnecting...');
  });

  return client;
};

// Export a singleton instance
export const pusherClient = createPusherClient(); 