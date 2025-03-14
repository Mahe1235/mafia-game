/**
 * Application dependencies initialization
 * Centralizes all external service connections
 */
import mongoose from 'mongoose';
import { CONFIG } from './config';
import { logger } from '@/utils/logger';

export class Dependencies {
  private static _instance: Dependencies;
  private _isConnected: boolean = false;

  private constructor() {}

  static getInstance(): Dependencies {
    if (!Dependencies._instance) {
      Dependencies._instance = new Dependencies();
    }
    return Dependencies._instance;
  }

  async initMongoDB(): Promise<void> {
    try {
      if (this._isConnected) {
        logger.info('MongoDB already connected');
        return;
      }

      await mongoose.connect(CONFIG.MONGODB.URI, {
        dbName: CONFIG.MONGODB.DB_NAME
      });

      this._isConnected = true;
      logger.info('MongoDB connected successfully');
    } catch (error) {
      logger.error('MongoDB connection failed:', error);
      throw error;
    }
  }

  async cleanup(): Promise<void> {
    if (this._isConnected) {
      await mongoose.disconnect();
      this._isConnected = false;
      logger.info('MongoDB connection closed');
    }
  }
}

export const dependencies = Dependencies.getInstance(); 