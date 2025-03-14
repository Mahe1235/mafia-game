/**
 * GraphQL API route handler for Next.js
 * Handles all GraphQL requests and initializes MongoDB connection
 */
import { NextRequest } from 'next/server';
import { dependencies } from '@/dependencies';
import { logger } from '@/utils/logger';
import apolloServer from '@/graphql/server';

// Initialize MongoDB connection
dependencies.initMongoDB().catch(error => {
  logger.error('Failed to initialize MongoDB:', error);
  process.exit(1);
});

const handler = async (req: NextRequest) => {
  try {
    return await apolloServer(req);
  } catch (error) {
    logger.error('GraphQL request failed:', error);
    throw error;
  }
};

export { handler as GET, handler as POST }; 