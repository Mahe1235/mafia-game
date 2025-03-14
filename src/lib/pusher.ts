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
  // Only initialize Pusher client in browser environment
  const isBrowser = typeof window !== 'undefined';
  if (!isBrowser) {
    // Return a dummy client for server-side rendering
    return {
      connection: {
        state: 'unavailable',
        bind: () => {},
        unbind: () => {},
        unbind_all: () => {}
      },
      subscribe: () => ({
        bind: () => {},
        unbind: () => {},
        unbind_all: () => {}
      }),
      unsubscribe: () => {}
    } as unknown as PusherClient;
  }

  // Log configuration for debugging
  const appKey = process.env.NEXT_PUBLIC_PUSHER_APP_KEY;
  const cluster = process.env.NEXT_PUBLIC_PUSHER_APP_CLUSTER;
  
  if (!appKey || !cluster) {
    logger.error('Pusher configuration missing', { 
      appKey: appKey ? 'set' : 'missing', 
      cluster: cluster ? 'set' : 'missing'
    });
    
    // In development, show more details to help debug
    if (process.env.NODE_ENV === 'development') {
      console.warn('Pusher configuration incomplete:', {
        NEXT_PUBLIC_PUSHER_APP_KEY: appKey || '❌ missing',
        NEXT_PUBLIC_PUSHER_APP_CLUSTER: cluster || '❌ missing'
      });
    }
  }

  try {
    const client = new PusherClient(appKey || '', {
      cluster: cluster || '',
      forceTLS: true,
      enabledTransports: ['ws', 'wss'],
      disabledTransports: ['xhr_streaming', 'xhr_polling', 'sockjs'],
      // Add reconnection exponential backoff
      activityTimeout: 30000, // 30s
      pongTimeout: 15000, // 15s
      // Increased timeouts for more resilience
      timeout: 20000,
      // Auto reconnect on disconnection
      autoReconnect: true,
      // Maximum number of reconnection attempts
      maxReconnectionAttempts: 10
    });

    // Add global connection logging and error handling
    client.connection.bind('error', (err: any) => {
      logger.error('Pusher connection error:', err);
      
      // In development, log more details to console
      if (process.env.NODE_ENV === 'development') {
        console.error('Pusher connection error:', {
          message: err.message || 'Unknown error',
          type: err.type || 'Unknown type',
          data: err.data || {},
          config: {
            key: appKey ? `${appKey.substring(0, 5)}...` : 'not set',
            cluster: cluster || 'not set'
          }
        });
      }
    });

    client.connection.bind('connected', () => {
      logger.info('Pusher connected successfully');
      // Reset any connection error state in the app if needed
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

    client.connection.bind('failed', () => {
      logger.error('Pusher connection failed after multiple attempts');
      
      // In development, log helpful debugging information
      if (process.env.NODE_ENV === 'development') {
        console.error('Pusher connection failed. Check your configuration:', {
          NEXT_PUBLIC_PUSHER_APP_KEY: appKey ? 'set' : 'missing',
          NEXT_PUBLIC_PUSHER_APP_CLUSTER: cluster ? 'set' : 'missing',
          url: client.connection.options.wsHost || 'unknown',
          connectionState: client.connection.state
        });
      }
    });

    return client;
  } catch (error) {
    logger.error('Error initializing Pusher client:', error);
    
    // Return a dummy client in case of error
    return {
      connection: {
        state: 'failed',
        bind: () => {},
        unbind: () => {},
        unbind_all: () => {}
      },
      subscribe: () => ({
        bind: () => {},
        unbind: () => {},
        unbind_all: () => {}
      }),
      unsubscribe: () => {}
    } as unknown as PusherClient;
  }
};

// Export a singleton instance
export const pusherClient = createPusherClient(); 