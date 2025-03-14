/**
 * Logger utility for consistent logging across the application
 * Safe for both client and server environments
 */
type LogLevel = 'info' | 'warn' | 'error' | 'debug';

class Logger {
  private static _instance: Logger;

  private constructor() {}

  static getInstance(): Logger {
    if (!Logger._instance) {
      Logger._instance = new Logger();
    }
    return Logger._instance;
  }

  private log(level: LogLevel, message: string, ...args: any[]): void {
    // Check if console is available (it should be, but defensive programming)
    if (typeof console === 'undefined') return;
    
    try {
      const timestamp = new Date().toISOString();
      const formattedArgs = args.map(arg => {
        if (arg instanceof Error) {
          return { 
            message: arg.message, 
            stack: arg.stack,
            name: arg.name
          };
        }
        return arg;
      });
      
      console[level](`[${timestamp}] [${level.toUpperCase()}]:`, message, ...formattedArgs);
    } catch (error) {
      // Last resort fallback
      try {
        console.error('Logger error:', error);
      } catch {
        // Cannot do anything else if console is completely broken
      }
    }
  }

  info(message: string, ...args: any[]): void {
    this.log('info', message, ...args);
  }

  warn(message: string, ...args: any[]): void {
    this.log('warn', message, ...args);
  }

  error(message: string, ...args: any[]): void {
    this.log('error', message, ...args);
  }

  debug(message: string, ...args: any[]): void {
    if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
      this.log('debug', message, ...args);
    }
  }
}

// Create a safe logger that won't crash in any environment
const createSafeLogger = () => {
  try {
    return Logger.getInstance();
  } catch (error) {
    // Fallback logger if singleton instantiation fails
    return {
      info: () => {},
      warn: () => {},
      error: () => {},
      debug: () => {}
    };
  }
};

export const logger = createSafeLogger();