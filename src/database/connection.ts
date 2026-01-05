/**
 * MongoDB Database Connection Utility
 *
 * Provides connection management for MongoDB with:
 * - Connection pooling for optimal performance
 * - Retry logic for transient failures
 * - Connection status monitoring
 * - Environment-based configuration
 *
 * @module database/connection
 */

import mongoose from 'mongoose';

/**
 * Database connection configuration options
 */
export interface DatabaseConfig {
  uri: string;
  options?: mongoose.ConnectOptions;
  autoConnect?: boolean;
}

/**
 * Connection status enumeration
 */
export enum ConnectionStatus {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  DISCONNECTING = 'disconnecting',
  ERROR = 'error'
}

/**
 * Database connection manager class
 */
class DatabaseConnection {
  private static instance: DatabaseConnection;
  private connection: typeof mongoose | null = null;
  private status: ConnectionStatus = ConnectionStatus.DISCONNECTED;
  private config: DatabaseConfig | null = null;
  private retryAttempts = 0;
  private readonly maxRetries = 3;
  private readonly retryDelay = 5000; // 5 seconds

  private constructor() {
    // Private constructor for singleton pattern
  }

  /**
   * Get singleton instance of DatabaseConnection
   */
  public static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  /**
   * Configure database connection
   *
   * @param config - Database configuration options
   */
  public configure(config: DatabaseConfig): void {
    this.config = config;
  }

  /**
   * Connect to MongoDB database
   *
   * @param uri - MongoDB connection URI (optional if configured)
   * @param options - Mongoose connection options
   * @returns Promise resolving to mongoose instance
   * @throws Error if connection fails after retries
   */
  public async connect(
    uri?: string,
    options?: mongoose.ConnectOptions
  ): Promise<typeof mongoose> {
    // Use provided URI or configured URI
    const connectionUri = uri || this.config?.uri || process.env.MONGODB_URI;

    if (!connectionUri) {
      throw new Error('MongoDB URI is required. Provide via parameter, configuration, or MONGODB_URI environment variable.');
    }

    // If already connected, return existing connection
    if (this.connection && this.status === ConnectionStatus.CONNECTED) {
      return this.connection;
    }

    // Default connection options
    const defaultOptions: mongoose.ConnectOptions = {
      maxPoolSize: 10,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4, // Use IPv4
      ...this.config?.options,
      ...options
    };

    try {
      this.status = ConnectionStatus.CONNECTING;
      this.connection = await mongoose.connect(connectionUri, defaultOptions);
      this.status = ConnectionStatus.CONNECTED;
      this.retryAttempts = 0;

      // Setup connection event handlers
      this.setupEventHandlers();

      console.log('MongoDB connected successfully');
      return this.connection;
    } catch (error) {
      this.status = ConnectionStatus.ERROR;
      console.error('MongoDB connection error:', error);

      // Retry logic
      if (this.retryAttempts < this.maxRetries) {
        this.retryAttempts++;
        console.log(`Retrying connection (attempt ${this.retryAttempts}/${this.maxRetries})...`);
        await this.sleep(this.retryDelay);
        return this.connect(uri, options);
      }

      throw new Error(`Failed to connect to MongoDB after ${this.maxRetries} attempts: ${error}`);
    }
  }

  /**
   * Disconnect from MongoDB database
   *
   * @returns Promise resolving when disconnected
   */
  public async disconnect(): Promise<void> {
    if (this.connection) {
      this.status = ConnectionStatus.DISCONNECTING;
      await mongoose.disconnect();
      this.connection = null;
      this.status = ConnectionStatus.DISCONNECTED;
      console.log('MongoDB disconnected');
    }
  }

  /**
   * Get current connection status
   *
   * @returns Current connection status
   */
  public getStatus(): ConnectionStatus {
    return this.status;
  }

  /**
   * Check if database is connected
   *
   * @returns True if connected, false otherwise
   */
  public isConnected(): boolean {
    return this.status === ConnectionStatus.CONNECTED &&
           mongoose.connection.readyState === 1;
  }

  /**
   * Get underlying mongoose connection
   *
   * @returns Mongoose connection or null
   */
  public getConnection(): typeof mongoose | null {
    return this.connection;
  }

  /**
   * Setup event handlers for connection monitoring
   */
  private setupEventHandlers(): void {
    mongoose.connection.on('error', (error) => {
      console.error('MongoDB connection error:', error);
      this.status = ConnectionStatus.ERROR;
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected');
      this.status = ConnectionStatus.DISCONNECTED;
    });

    mongoose.connection.on('reconnected', () => {
      console.log('MongoDB reconnected');
      this.status = ConnectionStatus.CONNECTED;
    });
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const dbConnection = DatabaseConnection.getInstance();

/**
 * Connect to MongoDB database (convenience function)
 *
 * @param uri - MongoDB connection URI (optional)
 * @param options - Mongoose connection options
 * @returns Promise resolving to mongoose instance
 *
 * @example
 * ```typescript
 * import { dbConnect } from '@chabaduniverse/auth/database';
 *
 * // Connect to MongoDB
 * await dbConnect();
 *
 * // Or with custom URI
 * await dbConnect('mongodb://localhost:27017/mydb');
 * ```
 */
export async function dbConnect(
  uri?: string,
  options?: mongoose.ConnectOptions
): Promise<typeof mongoose> {
  return dbConnection.connect(uri, options);
}

/**
 * Disconnect from MongoDB database (convenience function)
 *
 * @returns Promise resolving when disconnected
 *
 * @example
 * ```typescript
 * import { dbDisconnect } from '@chabaduniverse/auth/database';
 *
 * // Disconnect from MongoDB
 * await dbDisconnect();
 * ```
 */
export async function dbDisconnect(): Promise<void> {
  return dbConnection.disconnect();
}

/**
 * Check if database is connected (convenience function)
 *
 * @returns True if connected, false otherwise
 *
 * @example
 * ```typescript
 * import { isDbConnected } from '@chabaduniverse/auth/database';
 *
 * if (isDbConnected()) {
 *   // Database operations
 * }
 * ```
 */
export function isDbConnected(): boolean {
  return dbConnection.isConnected();
}

export default dbConnection;
