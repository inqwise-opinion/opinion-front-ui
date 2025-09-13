/**
 * Authentication Package Index
 * 
 * Provides clean exports for all authentication-related interfaces and types.
 * Centralizes authentication functionality for easy consumption by other parts of the application.
 */

// Core authentication interfaces
export { 
  AuthProvider, 
  isAuthProvider,
  AuthenticationError 
} from './AuthProvider';

// Session-based authentication
export { 
  SessionAuthProvider, 
  Account,
  isSessionAuthProvider
} from './SessionAuthProvider';

// Exception handling
export { 
  AuthenticationError,
  isAuthenticationError,
  createAuthenticationError,
  AuthErrors
} from './exceptions/AuthenticationExceptions';

// Authentication context and events
export { AuthenticatedUser } from './AuthenticatedUser';
export {
  AUTH_EVENTS,
  AuthEventName,
  AuthEventPayloads,
  AuthEvent,
  UserAuthenticatedPayload,
  createAuthEvent,
  AuthEventFactory,
  isAuthEvent
} from './AuthEvents';

// Authentication services
export { AuthService, AuthServiceConfig } from './AuthService';
export { SessionAuthService, SessionAuthServiceConfig } from './SessionAuthService';

// Implementation markers for future development
/**
 * TODO: Implementation markers for Task 3.3.1 completion tracking
 * 
 * PENDING IMPLEMENTATIONS:
 * - SessionAuthProviderImpl.ts - Session-based provider using OpinionService.validateUser()
 * - DevAuthProviderImpl.ts - Development/testing provider with mock authentication
 * 
 * INTEGRATION NOTES:
 * - SessionAuthProviderImpl should call OpinionService.validateUser() for all auth checks
 * - No client-side caching - delegate to DataLoader level
 * - Server manages session state via cookies
 * - DevAuthProvider needed for development/testing scenarios
 * 
 * NEXT STEPS:
 * - Task 3.3.2: Authentication Events Design (user approval required for each event)
 * - Task 3.3.3: AuthService Orchestrator Implementation
 * - Task 3.3.4: AppHeaderBinderService Implementation
 * - Task 3.3.5: Service Registration & Integration
 * - Task 3.3.6: AppHeader UI Integration
 * - Task 3.3.7: Testing & Validation
 */