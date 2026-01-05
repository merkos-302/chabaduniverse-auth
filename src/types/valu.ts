/**
 * Valu API Integration Types
 *
 * This file defines types and interfaces for integrating with the Valu Social platform.
 * It provides a framework-agnostic adapter pattern for Valu API communication.
 */

/**
 * Valu user data structure (from Valu API)
 */
export interface ValuUser {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  firstName?: string;
  lastName?: string;
  roles?: string[];
  permissions?: string[];
  profile?: {
    displayName?: string;
    profileImage?: string;
    bio?: string;
  };
  network?: {
    id: string;
    name: string;
    role: string;
  };
  metadata?: Record<string, unknown>;
}

/**
 * Valu API connection state
 */
export interface ValuConnectionState {
  /**
   * Whether the API is connected to Valu Social
   */
  isConnected: boolean;

  /**
   * Whether the API is ready for use (connected and initialized)
   */
  isReady: boolean;

  /**
   * Whether the app is running inside a Valu Social iframe
   */
  isInIframe: boolean;

  /**
   * Whether the app is currently navigating to another Valu app
   */
  isNavigatingApp: boolean;

  /**
   * Connection error message (if any)
   */
  error?: string | null;
}

/**
 * Valu API adapter interface
 *
 * This interface defines the contract for Valu API implementations.
 * It provides methods for authentication, user data retrieval, and API communication.
 */
export interface ValuAPIAdapter {
  /**
   * Get connection state
   */
  getConnectionState(): ValuConnectionState;

  /**
   * Get current authenticated user from Valu API
   * Returns null if user is not authenticated or API is not available
   */
  getCurrentUser(): Promise<ValuUser | null>;

  /**
   * Get user icon URL from Valu API
   * @param userId User ID (optional, defaults to current user)
   * @param size Icon size in pixels (default: 32)
   * @returns Icon URL or null if not available
   */
  getUserIcon(userId?: string, size?: number): Promise<string | null>;

  /**
   * Run console command in Valu API
   * @param command Console command to execute
   * @returns Command result or null
   */
  runConsoleCommand(command: string): Promise<any>;

  /**
   * Check if API is connected
   */
  isConnected(): boolean;

  /**
   * Check if API is ready for use
   */
  isReady(): boolean;

  /**
   * Check if running in Valu Social iframe
   */
  isInIframe(): boolean;

  /**
   * Check if navigating to another app
   */
  isNavigatingApp(): boolean;

  /**
   * Get auth API methods (if available)
   * Returns null if auth API is not available
   */
  getAuthApi(): ValuAuthAPI | null;
}

/**
 * Valu Auth API interface
 * Represents the Valu API's auth methods for user authentication
 */
export interface ValuAuthAPI {
  /**
   * Get current authenticated user
   */
  getCurrentUser?(): Promise<ValuUser | null>;

  /**
   * Run auth API method
   * @param method Method name to execute
   * @param args Method arguments
   */
  run?(method: string, ...args: any[]): Promise<any>;

  /**
   * Get user information
   */
  getUser?(): Promise<ValuUser | null>;

  /**
   * Check if user is authenticated
   */
  isAuthenticated?(): Promise<boolean>;
}

/**
 * Valu API configuration
 */
export interface ValuAPIConfig {
  /**
   * Enable debug logging
   */
  debug?: boolean;

  /**
   * Icon cache duration in milliseconds (default: 4 hours)
   */
  iconCacheDuration?: number;

  /**
   * Connection timeout in milliseconds (default: 10 seconds)
   */
  connectionTimeout?: number;

  /**
   * Auto-connect on initialization
   */
  autoConnect?: boolean;
}
