/**
 * Authentication Events - Typed Event Constants for EventBus Communication
 * 
 * Defines authentication-related events that flow through the EventBus system.
 * Enables decoupled communication between AuthService and UI components.
 * 
 * Design Principles:
 * - Minimal event set - only implement what's actually needed
 * - Each event requires explicit user approval before addition
 * - Events emitted before operation completion, only on success
 * - Strongly typed event payloads for type safety
 * 
 * Current Status: Only user.authenticated event approved
 * Future events will be added based on implementation needs and user approval
 */

import { AuthenticatedUser } from './AuthenticatedUser';

/**
 * Authentication event names as constants
 * 
 * Using const assertions for literal type inference and IDE autocomplete.
 * Each event name represents a successful authentication operation.
 */
export const AUTH_EVENTS = {
  /** 
   * User successfully authenticated
   * Emitted when authentication validation succeeds
   */
  USER_AUTHENTICATED: 'user.authenticated'
} as const;

/**
 * Type representing valid authentication event names
 */
export type AuthEventName = typeof AUTH_EVENTS[keyof typeof AUTH_EVENTS];

/**
 * Event payload for user authenticated event
 * 
 * Contains authenticated user information including account context.
 * Emitted when authentication validation completes successfully.
 */
export interface UserAuthenticatedPayload {
  /** Authenticated user with account context */
  user: AuthenticatedUser;
  /** Operation that triggered this authentication (e.g., 'login', 'session-validation') */
  operation: string;
  /** Timestamp when authentication was validated */
  timestamp: Date;
}

/**
 * Authentication event payload types mapping
 * 
 * Maps event names to their corresponding payload types.
 * Enables type-safe event handling in EventBus consumers.
 */
export interface AuthEventPayloads {
  [AUTH_EVENTS.USER_AUTHENTICATED]: UserAuthenticatedPayload;
}

/**
 * Type-safe authentication event descriptor
 * 
 * Generic type for authentication events that ensures payload type
 * matches the event name.
 */
export interface AuthEvent<T extends AuthEventName> {
  name: T;
  payload: AuthEventPayloads[T];
}

/**
 * Helper function to create type-safe authentication events
 * 
 * @param name - Event name (must be from AUTH_EVENTS)
 * @param payload - Event payload (type checked against event name)
 * @returns Typed authentication event
 */
export function createAuthEvent<T extends AuthEventName>(
  name: T,
  payload: AuthEventPayloads[T]
): AuthEvent<T> {
  return { name, payload };
}

/**
 * Factory functions for creating specific authentication events
 * 
 * Provides consistent event creation with proper typing and validation.
 */
export const AuthEventFactory = {
  /**
   * Create user authenticated event
   * 
   * @param user - Authenticated user instance
   * @param operation - Operation that triggered authentication
   * @returns UserAuthenticated event
   */
  userAuthenticated(
    user: AuthenticatedUser, 
    operation: string = 'authentication'
  ): AuthEvent<typeof AUTH_EVENTS.USER_AUTHENTICATED> {
    return createAuthEvent(AUTH_EVENTS.USER_AUTHENTICATED, {
      user,
      operation,
      timestamp: new Date()
    });
  }
} as const;

/**
 * Type guard to check if an event is an authentication event
 * 
 * @param event - Event to check
 * @returns true if event is an authentication event
 */
export function isAuthEvent(event: any): event is AuthEvent<AuthEventName> {
  return event &&
         typeof event.name === 'string' &&
         Object.values(AUTH_EVENTS).includes(event.name as AuthEventName) &&
         event.payload &&
         typeof event.payload === 'object';
}

// Mark for future development
/**
 * FUTURE EVENTS (pending user approval):
 * 
 * Potential events that may be added based on implementation needs:
 * - user.logout - When user logs out successfully
 * - user.authentication.failed - When authentication validation fails
 * - user.session.expired - When session expires
 * - user.account.switched - When user switches account context
 * 
 * Each of these will require explicit user approval before implementation.
 */