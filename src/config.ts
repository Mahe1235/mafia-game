/**
 * Application configuration
 * Contains all environment variables and configuration settings
 */
export const CONFIG = {
  MONGODB: {
    URI: process.env.MONGODB_URI || 'mongodb://localhost:27017',
    DB_NAME: process.env.MONGODB_DB || 'mafia_game'
  },
  PUSHER: {
    APP_ID: process.env.PUSHER_APP_ID || '',
    KEY: process.env.PUSHER_KEY || '',
    SECRET: process.env.PUSHER_SECRET || '',
    CLUSTER: process.env.PUSHER_CLUSTER || ''
  },
  GAME: {
    MIN_PLAYERS: 6,
    MAX_PLAYERS: 15,
    RATE_LIMIT: {
      MAX_REQUESTS: 100,
      WINDOW_MS: 60000 // 1 minute
    }
  }
}; 